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
import {
    REQUEST_DATASET_CONFIG,
    REQUEST_MAP_CONFIG,
    REQUEST_GEOSTORY_CONFIG,
    REQUEST_DOCUMENT_CONFIG,
    REQUEST_NEW_GEOSTORY_CONFIG,
    REQUEST_NEW_MAP_CONFIG,
    REQUEST_DASHBOARD_CONFIG,
    REQUEST_NEW_DASHBOARD_CONFIG
} from '@js/actions/gnviewer';
import { getNewMapConfiguration, getNewGeoStoryConfig } from '@js/api/geonode/config';
import {
    getDatasetByPk,
    getGeoAppByPk,
    getDocumentByPk,
    getMapByPk
} from '@js/api/geonode/v2';
import { error as errorNotification } from '@mapstore/framework/actions/notifications';
import { configureMap } from '@mapstore/framework/actions/config';
import {
    browseData,
    selectNode,
    showSettings
} from '@mapstore/framework/actions/layers';
import { toggleStyleEditor } from '@mapstore/framework/actions/styleeditor';
import {
    // setResourcePermissions,
    setNewResource,
    setResourceType,
    setResourceId,
    setResource
} from '@js/actions/gnresource';

import {
    setCurrentStory,
    setResource as setGeoStoryResource,
    setEditing
} from '@mapstore/framework/actions/geostory';
import {
    // dashboardLoaded,
    dashboardLoading
} from '@mapstore/framework/actions/dashboard';

import { setControlProperty } from '@mapstore/framework/actions/controls';
import { resourceToLayerConfig } from '@js/utils/ResourceUtils';

export const gnViewerrequestDatasetConfig = (action$) =>
    action$.ofType(REQUEST_DATASET_CONFIG)
        .switchMap(({ pk, page }) => {
            return Observable.defer(() => axios.all([
                getNewMapConfiguration(),
                getDatasetByPk(pk)
            ])).switchMap((response) => {
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
                    setResourceType('dataset'),
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
            }).catch(() => {
                // TODO: implement various error cases
                return Observable.empty();
            });
        });

export const gnViewerRequestMapConfig = (action$) =>
    action$.ofType(REQUEST_MAP_CONFIG)
        .switchMap(({ pk }) => {
            return Observable.defer(() => getMapByPk(pk))
                .switchMap((response) => {
                    const { data, ...resource }  = response;
                    return Observable.of(
                        configureMap(data),
                        setResource(resource),
                        setResourceId(pk),
                        setResourceType('map')
                    );
                }).catch(() => {
                    // TODO: implement various error cases
                    return Observable.empty();
                });
        });

export const gnViewerRequestNewMapConfig = (action$) =>
    action$.ofType(REQUEST_NEW_MAP_CONFIG)
        .switchMap(() => {
            return Observable.defer(getNewMapConfiguration
            ).switchMap((response) => {
                return Observable.of(
                    configureMap(response),
                    setResourceType('map')
                );
            }).catch(() => {
                // TODO: implement various error cases
                return Observable.empty();
            })
                .startWith(setNewResource());
        });

export const gnViewerRequestGeoStoryConfig = (action$) =>
    action$.ofType(REQUEST_GEOSTORY_CONFIG)
        .switchMap(({ pk }) => {
            return Observable.defer(() => axios.all([
                getGeoAppByPk(pk)
            ])).switchMap((response) => {
                const [gnGeoStory] = response;
                const { data, ...resource } = gnGeoStory;
                return Observable.of(
                    setCurrentStory(data),
                    setResource(resource),
                    setResourceId(pk),
                    setResourceType('geostory'),
                    setGeoStoryResource({
                        canEdit: resource?.perms?.includes('change_resourcebase')
                    })
                );
            }).catch(() => {
                // TODO: implement various error cases
                return Observable.empty();
            });
        });

export const gnViewerRequestNewGeoStoryConfig = (action$, { getState = () => {}}) =>
    action$.ofType(REQUEST_NEW_GEOSTORY_CONFIG)
        .switchMap(() => {
            const canAddResource = getState()?.security?.user?.perms?.includes('add_resource');
            if (!canAddResource) {
                return Observable.of(
                    setGeoStoryResource({
                        canEdit: false
                    }),
                    errorNotification({title: "geostory.errors.loading.title", message: "viewer.errors.noPermissions"})
                );
            }
            return Observable.defer(() => getNewGeoStoryConfig())
                .switchMap((gnGeoStory) => {
                    return Observable.of(
                        setCurrentStory({...gnGeoStory, sections: [{...gnGeoStory.sections[0], id: uuid(),
                            contents: [{...gnGeoStory.sections[0].contents[0], id: uuid()}]}]}),
                        setResourceType('geostory'),
                        setEditing(true),
                        setGeoStoryResource({
                            canEdit: true
                        })
                    );
                }).catch(() => {
                    return Observable.empty();
                })
                .startWith(setNewResource());
        });

export const gnViewerRequestDocumentConfig = (action$) =>
    action$.ofType(REQUEST_DOCUMENT_CONFIG)
        .switchMap(({ pk }) => {
            return Observable.defer(() => axios.all([
                getDocumentByPk(pk)
            ])).switchMap((response) => {
                const [gnDocument] = response;
                return Observable.of(
                    setResource(gnDocument),
                    setResourceType('document'),
                    setResourceId(pk)
                );
            }).catch(() => {
                // TODO: implement various error cases
                return Observable.empty();
            });
        });


export const gnViewerRequestDashboardConfig = (action$) =>
    action$.ofType(REQUEST_DASHBOARD_CONFIG)
        .switchMap(() => {

            return Observable.defer(() => new Promise(resolve => resolve({})))
                .switchMap(( /* gnDashboard */ ) => {
                    /*
                    const { data, ...resource } = gnDashboard;
                    return Observable.of(
                        dashboardLoaded(
                            { // ms dashboard config example
                                canDelete: false,
                                canEdit: false,
                                creation:'2020-02-20T11:10:09.488+01:00',
                                description: 'Filtering Capabilities',
                                id: 21694,
                                lastUpdate: '2021-04-09T10:37:07.870+02:00',
                                name: 'Demo Dashboard'
                            },
                            data
                        ),
                        setResource(resource),
                        setResourceId(pk),
                        setResourceType('dashboard')
                    );
                    */
                    return Observable.empty();
                }).catch(() => {
                    return Observable.empty();
                })
                .startWith(dashboardLoading(false));
        });

export const gnViewerRequestNewDashboardConfig = (action$) =>
    action$.ofType(REQUEST_NEW_DASHBOARD_CONFIG)
        .switchMap(() => {

            return Observable.defer(() => new Promise(resolve => resolve({})))
                .switchMap(() => {
                    return Observable.empty();
                }).catch(() => {
                    return Observable.empty();
                })
                .startWith(setNewResource(), dashboardLoading(false));
        });

export default {
    gnViewerrequestDatasetConfig,
    gnViewerRequestMapConfig,
    gnViewerRequestNewMapConfig,
    gnViewerRequestGeoStoryConfig,
    gnViewerRequestDocumentConfig,
    gnViewerRequestNewGeoStoryConfig,
    gnViewerRequestDashboardConfig,
    gnViewerRequestNewDashboardConfig
};
