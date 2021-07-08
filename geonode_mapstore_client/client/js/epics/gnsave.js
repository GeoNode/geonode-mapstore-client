/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import { mapSelector, mapInfoSelector } from '@mapstore/framework/selectors/map';
import { layersSelector, groupsSelector } from '@mapstore/framework/selectors/layers';
import { backgroundListSelector } from '@mapstore/framework/selectors/backgroundselector';
import { mapOptionsToSaveSelector } from '@mapstore/framework/selectors/mapsave';
import {
    textSearchConfigSelector,
    bookmarkSearchConfigSelector
} from '@mapstore/framework/selectors/searchconfig';
import { saveMapConfiguration } from '@mapstore/framework/utils/MapUtils';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { currentStorySelector } from '@mapstore/framework/selectors/geostory';
import { userSelector } from '@mapstore/framework/selectors/security';
import { error as errorNotification, success as successNotification } from '@mapstore/framework/actions/notifications';
import {
    SAVE_CONTENT,
    UPDATE_RESOURCE_BEFORE_SAVE,
    saveSuccess,
    saveError,
    savingResource,
    SAVE_DIRECT_CONTENT,
    saveContent
} from '@js/actions/gnsave';
import {
    resourceLoading,
    setResource,
    resourceError,
    updateResourceProperties,
    SET_FAVORITE_RESOURCE
} from '@js/actions/gnresource';
import {
    getResourceByPk,
    createGeoStory,
    updateGeoStory,
    createMap,
    updateMap,
    updateDocument,
    setFavoriteResource
} from '@js/api/geonode/v2';
import { parseDevHostname } from '@js/utils/APIUtils';
import uuid from 'uuid';
import {
    getResourceName,
    getResourceDescription,
    getResourceThumbnail
} from '@js/selectors/gnresource';

const SaveAPI = {
    map: (state, id, metadata, reload) => {
        const map =  mapSelector(state) || {};
        const layers = layersSelector(state);
        const groups = groupsSelector(state);
        const backgrounds = backgroundListSelector(state);
        const textSearchConfig = textSearchConfigSelector(state);
        const bookmarkSearchConfig = bookmarkSearchConfigSelector(state);
        const additionalOptions = mapOptionsToSaveSelector(state);
        const data = saveMapConfiguration(
            map,
            layers,
            groups,
            backgrounds,
            textSearchConfig,
            bookmarkSearchConfig,
            additionalOptions
        );
        const body = {
            "title": metadata.name,
            "abstract": metadata.description,
            "thumbnail_url": metadata.thumbnail,
            "data": data
        };
        return id
            ? updateMap(id, { ...body, id })
            : createMap(body)
                .then((response) => {
                    if (reload) {
                        window.location.href = parseDevHostname(`${getConfigProp('geonodeUrl')}viewer/#/map/${response.pk}`);
                        window.location.reload();
                    }
                    return response.data;
                });
    },
    geostory: (state, id, metadata, reload) => {
        const story = currentStorySelector(state);
        const user = userSelector(state);
        const body = {
            'title': metadata.name,
            'abstract': metadata.description,
            'thumbnail_url': metadata.thumbnail,
            'data': story
        };
        return id
            ? updateGeoStory(id, body)
            : createGeoStory({
                'name': metadata.name + ' ' + uuid(),
                'owner': user.name,
                ...body
            }).then((response) => {
                if (reload) {
                    window.location.href = parseDevHostname(`${getConfigProp('geonodeUrl')}viewer/#/geostory/${response.pk}`);
                    window.location.reload();
                }
                return response.data;
            });
    },
    document: (state, id, metadata) => {
        const body = {
            'title': metadata.name,
            'abstract': metadata.description,
            'thumbnail_url': metadata.thumbnail
        };

        return id ? updateDocument(id, body) : false;

    }
};

export const gnSaveContent = (action$, store) =>
    action$.ofType(SAVE_CONTENT)
        .switchMap((action) => {
            const state = store.getState();
            const contentType = state.gnresource?.type || 'map';
            return Observable.defer(() => SaveAPI[contentType](state, action.id, action.metadata, action.reload))
                .switchMap((response) => {
                    return Observable.of(
                        saveSuccess(response),
                        updateResourceProperties({
                            'title': action.metadata.name,
                            'abstract': action.metadata.description,
                            'thumbnail_url': action.metadata.thumbnail,
                            'extension': response?.extension,
                            'href': response?.href
                        }),
                        ...(action.showNotifications
                            ? [successNotification({title: "saveDialog.saveSuccessTitle", message: "saveDialog.saveSuccessMessage"})]
                            : [])
                    );
                })
                .catch((error) => {
                    return Observable.of(
                        saveError(error.data || error.message),
                        ...(action.showNotifications
                            ? [errorNotification({title: "map.mapError.errorTitle", message: "map.mapError.errorDefault"})]
                            : [])
                    );
                })
                .startWith(savingResource());

        });

export const gnSaveDirectContent = (action$, store) =>
    action$.ofType(SAVE_DIRECT_CONTENT)
        .switchMap(() => {
            const state = store.getState();
            const mapInfo = mapInfoSelector(state);
            const resourceId = mapInfo?.id
            || state?.gnresource?.id; // injected geostory id
            return Observable.defer(() => getResourceByPk(resourceId))
                .switchMap((resource) => {
                    const name = getResourceName(state);
                    const description = getResourceDescription(state);
                    const thumbnail = getResourceThumbnail(state);
                    const metadata = {
                        name: (name) ? name : resource?.title,
                        description: (description) ? description : resource?.abstract,
                        thumbnail: (thumbnail) ? thumbnail : resource?.thumbnail_url,
                        extension: resource?.extension,
                        href: resource?.href
                    };
                    return Observable.of(
                        setResource(resource),
                        saveContent(resourceId, metadata, false, true /* showNotification */)
                    );
                })
                .catch((error) => {
                    return Observable.of(
                        saveError(error.data || error.message),
                        errorNotification({title: "map.mapError.errorTitle", message: error.data || error.message || "map.mapError.errorDefault"})
                    );
                })
                .startWith(savingResource());
        });

export const gnUpdateResource = (action$, store) =>
    action$.ofType(UPDATE_RESOURCE_BEFORE_SAVE)
        .switchMap((action) => {
            const state = store.getState();
            const currentResource = state.gnresource?.data || {};
            if ( !action.id
            || currentResource.pk && action.id && currentResource.pk + '' === action.id + '') {
                return Observable.empty();
            }
            return Observable.defer(() => getResourceByPk(action.id))
                .switchMap((resource) => {
                    return Observable.of(setResource(resource));
                })
                .catch((error) => {
                    return Observable.of(resourceError(error.data || error.message));
                })
                .startWith(resourceLoading());
        });

export const gnSaveFavoriteContent = (action$, store) =>
    action$.ofType(SET_FAVORITE_RESOURCE)
        .switchMap((action) => {
            const state = store.getState();
            const pk = state?.gnresource?.data.pk;
            const favorite =  action.favorite;
            return Observable
                .defer(() => setFavoriteResource(pk, favorite))
                .switchMap(() => {
                    return Observable.of(
                        updateResourceProperties({
                            'favorite': favorite
                        })
                    );
                })
                .catch((error) => {
                    return Observable.of(resourceError(error.data || error.message));
                });

        });


export default {
    gnSaveContent,
    gnUpdateResource,
    gnSaveDirectContent,
    gnSaveFavoriteContent
};
