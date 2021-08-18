/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import { Observable } from 'rxjs';
import { mapInfoSelector } from '@mapstore/framework/selectors/map';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { userSelector } from '@mapstore/framework/selectors/security';
import {
    error as errorNotification,
    success as successNotification,
    warning as warningNotification
} from '@mapstore/framework/actions/notifications';
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
    resetGeoLimits,
    setResourceCompactPermissions
} from '@js/actions/gnresource';
import {
    getResourceByPk,
    updateDataset,
    createGeoApp,
    updateGeoApp,
    createMap,
    updateMap,
    updateDocument,
    updateCompactPermissionsByPk
} from '@js/api/geonode/v2';
import { parseDevHostname } from '@js/utils/APIUtils';
import uuid from 'uuid';
import {
    getResourceName,
    getResourceDescription,
    getResourceThumbnail,
    getPermissionsPayload,
    getResourceData,
    getResourceId,
    getDataPayload,
    getCompactPermissions
} from '@js/selectors/resource';

import {
    updateGeoLimits,
    deleteGeoLimits
} from '@js/api/geonode/security';
import {
    STOP_ASYNC_PROCESS,
    startAsyncProcess
} from '@js/actions/resourceservice';
import {
    ResourceTypes,
    cleanCompactPermissions
} from '@js/utils/ResourceUtils';
import {
    ProcessTypes,
    ProcessStatus
} from '@js/utils/ResourceServiceUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';

const SaveAPI = {
    [ResourceTypes.MAP]: (state, id, body, reload) => {
        return id
            ? updateMap(id, { ...body, id })
            : createMap(body)
                .then((response) => {
                    if (reload) {
                        const { geonodeUrl = '/' } = getConfigProp('geoNodeSettings') || {};
                        window.location.href = parseDevHostname(`${geonodeUrl}catalogue/#/map/${response.pk}`);
                        window.location.reload();
                    }
                    return response.data;
                });
    },
    [ResourceTypes.GEOSTORY]: (state, id, body, reload) => {
        const user = userSelector(state);
        return id
            ? updateGeoApp(id, body)
            : createGeoApp({
                'name': body.title + ' ' + uuid(),
                'owner': user.name,
                'resource_type': ResourceTypes.GEOSTORY,
                ...body
            }).then((response) => {
                if (reload) {
                    const { geonodeUrl = '/' } = getConfigProp('geoNodeSettings') || {};
                    // reset all pending changes from localStore
                    window.location.href = parseDevHostname(`${geonodeUrl}catalogue/#/geostory/${response.pk}`);
                    window.location.reload();
                }
                return response.data;
            });
    },
    [ResourceTypes.DASHBOARD]: (state, id, body, reload) => {
        const user = userSelector(state);
        return id
            ? updateGeoApp(id, body)
            : createGeoApp({
                'name': body.title + ' ' + uuid(),
                'owner': user.name,
                'resource_type': ResourceTypes.DASHBOARD,
                ...body
            }).then((response) => {
                if (reload) {
                    const { geonodeUrl = '/' } = getConfigProp('geoNodeSettings') || {};
                    // reset all pending changes from localStore
                    window.location.href = parseDevHostname(`${geonodeUrl}catalogue/#/dashboard/${response.pk}`);
                    window.location.reload();
                }
                return response.data;
            });
    },
    [ResourceTypes.DOCUMENT]: (state, id, body) => {
        return id ? updateDocument(id, body) : false;
    },
    [ResourceTypes.DATASET]: (state, id, body) => {
        return id ? updateDataset(id, body) : false;
    }
};

export const gnSaveContent = (action$, store) =>
    action$.ofType(SAVE_CONTENT)
        .switchMap((action) => {
            const state = store.getState();
            const contentType = state.gnresource?.type || 'map';
            const data = getDataPayload(state, contentType);
            const body = {
                'title': action.metadata.name,
                'abstract': action.metadata.description,
                'thumbnail_url': action.metadata.thumbnail,
                ...(data && { 'data': JSON.parse(JSON.stringify(data)) })
            };
            const currentResource = getResourceData(state);
            return Observable.defer(() => SaveAPI[contentType](state, action.id, body, action.reload))
                .switchMap((response) => {
                    return Observable.of(
                        // reset all pending changes from localStore
                        setControlProperty('pendingChanges', 'value', null),
                        saveSuccess(response),
                        setResource({
                            ...currentResource,
                            ...body
                        }),
                        ...(action.showNotifications
                            ? [
                                action.showNotifications === true
                                    ? successNotification({title: "saveDialog.saveSuccessTitle", message: "saveDialog.saveSuccessMessage"})
                                    : warningNotification(action.showNotifications)
                            ]
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
            const resourceId = mapInfo?.id || getResourceId(state);
            const { compactPermissions, geoLimits } = getPermissionsPayload(state);
            const currentResource = getResourceData(state);
            return Observable.concat(
                ...(compactPermissions ? [
                    Observable.defer(() =>
                        updateCompactPermissionsByPk(resourceId, cleanCompactPermissions(compactPermissions))
                            .then(output => ({ resource: currentResource, output, processType: ProcessTypes.PERMISSIONS_RESOURCE }))
                            .catch((error) => ({ resource: currentResource, error: error?.data?.detail || error?.statusText || error?.message || true, processType: ProcessTypes.PERMISSIONS_RESOURCE }))
                    )
                        .switchMap((payload) => {
                            return Observable.of(startAsyncProcess(payload));
                        })
                ] : []),
                Observable.defer(() => axios.all([
                    getResourceByPk(resourceId),
                    ...(geoLimits
                        ? geoLimits.map((limits) =>
                            limits.features.length === 0
                                ? deleteGeoLimits(resourceId, limits.id, limits.type)
                                    .catch(() => ({ error: true, resourceId, limits }))
                                : updateGeoLimits(resourceId, limits.id, limits.type, { features: limits.features })
                                    .catch(() => ({ error: true, resourceId, limits }))
                        )
                        : [])
                ]))
                    .switchMap(([resource, ...geoLimitsResponses]) => {
                        const geoLimitsErrors = geoLimitsResponses.filter(({ error }) => error);
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
                            saveContent(
                                resourceId,
                                metadata,
                                false,
                                geoLimitsErrors.length > 0
                                    ? {
                                        title: 'gnviewer.warningGeoLimitsSaveTitle',
                                        message: 'gnviewer.warningGeoLimitsSaveMessage'
                                    }
                                    : true /* showNotification */),
                            resetGeoLimits()
                        );
                    })
            )
                .catch((error) => {
                    return Observable.of(
                        saveError(error.data || error.message),
                        errorNotification({title: "map.mapError.errorTitle", message: error?.data?.detail || error?.message || "map.mapError.errorDefault"})
                    );
                })
                .startWith(savingResource());
        });

export const gnWatchStopPermissionsProcess = (action$, store) =>
    action$.ofType(STOP_ASYNC_PROCESS)
        .filter(action => action?.payload?.processType === ProcessTypes.PERMISSIONS_RESOURCE)
        .switchMap((action) => {
            const state = store.getState();
            const resourceId = getResourceId(state);
            if (resourceId !== action?.payload?.resource?.pk) {
                return Observable.empty();
            }
            const isError = action?.payload?.error || action?.payload?.output?.status === ProcessStatus.FAILED;
            if (isError) {
                return Observable.of(errorNotification({
                    title: 'gnviewer.errorCompactPermissionsTitle',
                    message: 'gnviewer.errorCompactPermissionsMessage'
                }));
            }
            // reset permission to remove pending changes
            const compactPermissions = getCompactPermissions(state);
            return Observable.of(setResourceCompactPermissions(compactPermissions));
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

export default {
    gnSaveContent,
    gnUpdateResource,
    gnSaveDirectContent,
    gnWatchStopPermissionsProcess
};
