/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import axios from '@mapstore/framework/libs/ajax';
import uuid from "uuid";
import url from "url";
import { getNewMapConfiguration, getNewGeoStoryConfig } from '@js/api/geonode/config';
import {
    getDatasetByPk,
    getGeoAppByPk,
    getDocumentByPk,
    getMapByPk
} from '@js/api/geonode/v2';
import { configureMap } from '@mapstore/framework/actions/config';
import {
    browseData,
    selectNode,
    showSettings
} from '@mapstore/framework/actions/layers';
import { toggleStyleEditor } from '@mapstore/framework/actions/styleeditor';
import {
    setNewResource,
    setResourceType,
    setResourceId,
    setResource,
    REQUEST_NEW_RESOURCE_CONFIG,
    REQUEST_RESOURCE_CONFIG,
    resetResourceState,
    loadingResourceConfig,
    resourceConfigError
} from '@js/actions/gnresource';

import {
    setCurrentStory,
    setResource as setGeoStoryResource,
    setEditing
} from '@mapstore/framework/actions/geostory';
import {
    dashboardLoaded,
    dashboardLoading
} from '@mapstore/framework/actions/dashboard';

import {
    setControlProperty,
    resetControls
} from '@mapstore/framework/actions/controls';
import {
    resourceToLayerConfig,
    ResourceTypes
} from '@js/utils/ResourceUtils';
import { canAddResource } from '@js/selectors/resource';

const resourceTypes = {
    [ResourceTypes.DATASET]: {
        resourceObservable: (pk, options) => {
            const { page } = options || {};
            return Observable.defer(() => axios.all([
                getNewMapConfiguration(),
                getDatasetByPk(pk)
            ]))
                .switchMap((response) => {
                    const [mapConfig, gnLayer] = response;
                    const newLayer = resourceToLayerConfig(gnLayer);
                    const {minx, miny, maxx, maxy } = newLayer?.bbox?.bounds || {};
                    const extent = newLayer?.bbox?.bounds && [minx, miny, maxx, maxy ];
                    return Observable.of(
                        configureMap({
                            ...mapConfig,
                            map: {
                                ...mapConfig.map,
                                layers: [
                                    ...mapConfig.map.layers,
                                    newLayer
                                ]
                            }
                        }),
                        ...(extent
                            ? [ setControlProperty('fitBounds', 'geometry', extent) ]
                            : []),
                        selectNode(newLayer.id, 'layer', false),
                        setResource(gnLayer),
                        setResourceId(pk),
                        ...(page === 'dataset_edit_data_viewer'
                            ? [
                                browseData(newLayer)
                            ]
                            : []),
                        ...(page === 'dataset_edit_style_viewer'
                            ? [
                                showSettings(newLayer.id, 'layers', {
                                    opacity: newLayer.opacity || 1
                                }),
                                setControlProperty('layersettings', 'activeTab', 'style'),
                                toggleStyleEditor(null, true)
                            ]
                            : [])
                    );
                });
        }
    },
    [ResourceTypes.MAP]: {
        resourceObservable: (pk) =>
            Observable.defer(() => getMapByPk(pk))
                .switchMap((response) => {
                    const { data, ...resource }  = response;
                    return Observable.of(
                        configureMap(data),
                        setResource(resource),
                        setResourceId(pk)
                    );
                }),
        newResourceObservable: () =>
            Observable.defer(() => getNewMapConfiguration())
                .switchMap((response) => {
                    return Observable.of(
                        configureMap(response)
                    );
                })
    },
    [ResourceTypes.GEOSTORY]: {
        resourceObservable: (pk) =>
            Observable.defer(() => getGeoAppByPk(pk))
                .switchMap((gnGeoStory) => {
                    const { data, ...resource } = gnGeoStory;
                    return Observable.of(
                        setCurrentStory(data),
                        setResource(resource),
                        setResourceId(pk),
                        setGeoStoryResource({
                            canEdit: resource?.perms?.includes('change_resourcebase')
                        })
                    );
                }),
        newResourceObservable: () =>
            Observable.defer(() => getNewGeoStoryConfig())
                .switchMap((gnGeoStory) => {
                    return Observable.of(
                        setCurrentStory({...gnGeoStory, sections: [{...gnGeoStory.sections[0], id: uuid(),
                            contents: [{...gnGeoStory.sections[0].contents[0], id: uuid()}]}]}),
                        setEditing(true),
                        setGeoStoryResource({
                            canEdit: true
                        })
                    );
                })
    },
    [ResourceTypes.DOCUMENT]: {
        resourceObservable: (pk) =>
            Observable.defer(() => getDocumentByPk(pk))
                .switchMap((gnDocument) => {
                    return Observable.of(
                        setResource(gnDocument),
                        setResourceId(pk)
                    );
                })
    },
    [ResourceTypes.DASHBOARD]: {
        resourceObservable: (pk, options) =>
            Observable.defer(() => getGeoAppByPk(pk))
                .switchMap(( gnDashboard ) => {
                    const { data, ...resource } = gnDashboard;
                    const { readOnly } = options || {};
                    const canEdit = !readOnly && resource?.perms?.includes('change_resourcebase') ? true : false;
                    const canDelete = !readOnly && resource?.perms?.includes('delete_resourcebase') ? true : false;
                    return Observable.of(
                        dashboardLoaded(
                            {
                                canDelete,
                                canEdit,
                                creation: resource.created,
                                description: resource.abstract,
                                id: pk,
                                lastUpdate: resource.last_updated,
                                name: resource.title
                            },
                            data
                        ),
                        setResource(resource),
                        setResourceId(pk)
                    );
                })
                .startWith(dashboardLoading(false)),
        newResourceObservable: () =>
            Observable.of(
                dashboardLoading(false)
            )
    }
};

export const gnViewerRequestNewResourceConfig = (action$, store) =>
    action$.ofType(REQUEST_NEW_RESOURCE_CONFIG)
        .switchMap((action) => {
            const { newResourceObservable } = resourceTypes[action.resourceType] || {};
            if (!canAddResource(store.getState())) {
                const formattedUrl = url.format({
                    ...window.location,
                    pathname: '/account/login/',
                    hash: '',
                    search: `?next=/catalogue`
                });
                window.location.href = formattedUrl;
                window.reload();
                return Observable.empty();
            }

            if (!newResourceObservable) {
                return Observable.of(
                    resetControls(),
                    resetResourceState(),
                    loadingResourceConfig(false)
                );
            }

            return Observable.concat(
                Observable.of(
                    resetControls(),
                    resetResourceState(),
                    loadingResourceConfig(true),
                    setNewResource(),
                    setResourceType(action.resourceType)
                ),
                newResourceObservable(),
                Observable.of(
                    loadingResourceConfig(false)
                )
            )
                .catch((error) => {
                    return Observable.of(
                        resetControls(),
                        resetResourceState(),
                        resourceConfigError(error.message)
                    );
                });
        });

export const gnViewerRequestResourceConfig = (action$) =>
    action$.ofType(REQUEST_RESOURCE_CONFIG)
        .switchMap((action) => {

            const { resourceObservable } = resourceTypes[action.resourceType] || {};

            if (!resourceObservable) {
                return Observable.of(
                    resetControls(),
                    resetResourceState(),
                    loadingResourceConfig(false)
                );
            }

            return Observable.concat(
                Observable.of(
                    resetControls(),
                    resetResourceState(),
                    loadingResourceConfig(true),
                    setResourceType(action.resourceType)
                ),
                resourceObservable(action.pk, action.options),
                Observable.of(
                    loadingResourceConfig(false)
                )
            )
                .catch((error) => {
                    return Observable.of(
                        resetControls(),
                        resetResourceState(),
                        resourceConfigError(error.message)
                    );
                });
        });

export default {
    gnViewerRequestNewResourceConfig,
    gnViewerRequestResourceConfig
};
