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
import get from 'lodash/get';
import isNil from 'lodash/isNil';

import {
    getNewMapConfiguration,
    getNewGeoStoryConfig,
    getDefaultPluginsConfig
} from '@js/api/geonode/config';
import {
    getDatasetByPk,
    getResourceByPk,
    getGeoAppByPk,
    getDocumentByPk,
    getMapByPk,
    getCompactPermissionsByPk,
    setResourceThumbnail,
    setLinkedResourcesByPk,
    removeLinkedResourcesByPk,
    getDatasetTimeSettingsByPk,
    getResourceByTypeAndByPk,
    deleteResourceThumbnail
} from '@js/api/geonode/v2';
import { configureMap } from '@mapstore/framework/actions/config';
import { isMapInfoOpen } from '@mapstore/framework/selectors/mapInfo';
import { isLoggedIn, userSelector } from '@mapstore/framework/selectors/security';
import {
    browseData,
    selectNode,
    showSettings,
    updateNode,
    hideSettings
} from '@mapstore/framework/actions/layers';
import {
    setSelectedResource,
    setShowDetails,
    SET_SHOW_DETAILS
} from '@mapstore/framework/plugins/ResourcesCatalog/actions/resources';
import {
    setNewResource,
    setResourceType,
    setResourceId,
    setResource,
    REQUEST_NEW_RESOURCE_CONFIG,
    REQUEST_RESOURCE_CONFIG,
    resetResourceState,
    loadingResourceConfig,
    resourceConfigError,
    setResourceCompactPermissions,
    updateResourceProperties,
    SET_RESOURCE_THUMBNAIL,
    updateResource,
    setResourcePathParameters,
    MANAGE_LINKED_RESOURCE,
    setMapViewerLinkedResource,
    REQUEST_RESOURCE,
    resourceLoading,
    resourceError,
    setSelectedLayer
} from '@js/actions/gnresource';

import {
    setCurrentStory,
    setResource as setGeoStoryResource,
    setEditing
} from '@mapstore/framework/actions/geostory';
import {
    dashboardLoaded,
    dashboardLoading,
    resetDashboard
} from '@mapstore/framework/actions/dashboard';

import {
    setControlProperty,
    resetControls,
    SET_CONTROL_PROPERTY
} from '@mapstore/framework/actions/controls';
import {
    resourceToLayerConfig,
    ResourceTypes,
    toMapStoreMapConfig,
    getCataloguePath,
    isDefaultDatasetSubtype
} from '@js/utils/ResourceUtils';
import {
    canAddResource,
    getInitialDatasetLayer,
    getResourceData,
    getResourceId,
    getResourceThumbnail
} from '@js/selectors/resource';
import { updateAdditionalLayer } from '@mapstore/framework/actions/additionallayers';
import { STYLE_OWNER_NAME } from '@mapstore/framework/utils/StyleEditorUtils';
import { initStyleService, resetStyleEditor } from '@mapstore/framework/actions/styleeditor';
import { CLICK_ON_MAP, resizeMap, CHANGE_MAP_VIEW, zoomToExtent } from '@mapstore/framework/actions/map';
import { purgeMapInfoResults, closeIdentify, NEW_MAPINFO_REQUEST } from '@mapstore/framework/actions/mapInfo';
import { saveError } from '@js/actions/gnsave';
import {
    error as errorNotification,
    success as successNotification,
    warning as warningNotification
} from '@mapstore/framework/actions/notifications';
import { convertDependenciesMappingForCompatibility } from '@mapstore/framework/utils/WidgetsUtils';
import {
    setResource as setContextCreatorResource,
    enableMandatoryPlugins,
    loadFinished,
    setCreationStep
} from '@mapstore/framework/actions/contextcreator';
import { setContext } from '@mapstore/framework/actions/context';
import { wrapStartStop } from '@mapstore/framework/observables/epics';
import { parseDevHostname } from '@js/utils/APIUtils';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { catalogClose } from '@mapstore/framework/actions/catalog';
import { VisualizationModes } from '@mapstore/framework/utils/MapTypeUtils';
import { forceUpdateMapLayout } from '@mapstore/framework/actions/maplayout';
import { getShowDetails } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import { searchSelector } from '@mapstore/framework/selectors/router';

const FIT_BOUNDS_CONTROL = 'fitBounds';

const resourceTypes = {
    [ResourceTypes.DATASET]: {
        resourceObservable: (pk, options) => {
            const { page, selectedLayer } = options || {};
            const { subtype, query } = options?.params || {};
            return Observable.defer(() =>
                axios.all([
                    getNewMapConfiguration(),
                    options?.isSamePreviousResource
                        ? new Promise(resolve => resolve(options.resourceData))
                        : isDefaultDatasetSubtype(subtype)
                            ? getDatasetByPk(pk)
                            : getResourceByPk(pk)
                ])
                    .then((response) => {
                        const [, gnLayer] = response ?? [];
                        if (gnLayer?.has_time) {
                            // fetch timeseries when applicable
                            return getDatasetTimeSettingsByPk(pk)
                                .then((timeseries) => response.concat(timeseries));
                        }
                        return response;
                    })
                    .then((response) => {
                        const [mapConfig, gnLayer, timeseries] = response;
                        const newLayer = options?.isSamePreviousResource
                            ? selectedLayer // keep configuration for other pages when resource id is the same (eg: filters)
                            : resourceToLayerConfig(gnLayer);
                        const _gnLayer = {...gnLayer, layerSettings: gnLayer.data};
                        return [mapConfig, {..._gnLayer, timeseries}, newLayer];
                    })
            )
                .switchMap((response) => {
                    const [mapConfig, gnLayer, newLayer] = response;
                    const {minx, miny, maxx, maxy } = newLayer?.bbox?.bounds || {};
                    const extent = newLayer?.bbox?.bounds && [minx, miny, maxx, maxy ];
                    return Observable.of(
                        configureMap({
                            ...mapConfig,
                            map: {
                                ...mapConfig.map,
                                visualizationMode: ['3dtiles'].includes(subtype) ? VisualizationModes._3D : VisualizationModes._2D,
                                layers: [
                                    ...mapConfig.map.layers,
                                    {
                                        ...newLayer,
                                        isDataset: true,
                                        _v_: Date.now()
                                    }
                                ]
                            }
                        }),
                        ...(extent
                            ? [ setControlProperty(FIT_BOUNDS_CONTROL, 'geometry', extent) ]
                            : []),
                        setControlProperty('toolbar', 'expanded', false),
                        forceUpdateMapLayout(),
                        selectNode(newLayer.id, 'layer', false),
                        ...(!options?.isSamePreviousResource ? [setResource(gnLayer)] : []),
                        setResourceId(pk),
                        ...(page === 'dataset_edit_data_viewer'
                            ? [
                                browseData(newLayer)
                            ]
                            : []),
                        ...(page === 'dataset_edit_layer_settings'
                            ? [
                                showSettings(newLayer.id, "layers", {opacity: newLayer.opacity ?? 1}),
                                setControlProperty("layersettings", "activeTab", query.tab ?? "general"),
                                updateAdditionalLayer(newLayer.id, STYLE_OWNER_NAME, 'override', {}),
                                resizeMap()
                            ]
                            : []),
                        ...(newLayer?.bboxError
                            ? [warningNotification({ title: "gnviewer.invalidBbox", message: "gnviewer.invalidBboxMsg" })]
                            : [])
                    );
                });
        }
    },
    [ResourceTypes.MAP]: {
        resourceObservable: (pk, options) =>
            Observable.defer(() =>  axios.all([
                getNewMapConfiguration(),
                getMapByPk(pk)
                    .then((resource) => {
                        const mapViewers = get(resource, 'linked_resources.linked_to', [])
                            .find(({ resource_type: type } = {}) => type === ResourceTypes.VIEWER);
                        // if we are using a query parameter for configuration
                        // we should not use the associated viewer
                        const { query } = url.parse(window.location.href, true);
                        return !query.config && mapViewers?.pk
                            ? axios.all([{...resource}, getGeoAppByPk(mapViewers?.pk, {api_preset: 'catalog_list', include: ['data', 'linked_resources']})])
                            : Promise.resolve([{...resource}]);
                    })
                    .catch(() => null)
            ]))
                .switchMap(([baseConfig, resource]) => {
                    const [mapResource, mapViewerResource] = resource ?? [];
                    const mapConfig = options.data
                        ? options.data
                        : toMapStoreMapConfig(mapResource, baseConfig);
                    return Observable.of(
                        configureMap(mapConfig),
                        setControlProperty('toolbar', 'expanded', false),
                        setContext(mapViewerResource ? mapViewerResource.data : null),
                        setResource(mapResource),
                        setResourceId(pk),
                        setMapViewerLinkedResource(mapViewerResource),
                        setResourcePathParameters({
                            ...options?.params,
                            appPk: mapViewerResource?.pk,
                            hasViewer: !!mapViewerResource?.pk
                        })
                    );
                }),
        newResourceObservable: (options) => {
            const queryDatasetParts = (options?.query?.['gn-dataset'] || '').split(':');
            const queryDatasetPk = queryDatasetParts[0];
            const quryDatasetSubtype = queryDatasetParts[1];
            return Observable.defer(() => axios.all([
                getNewMapConfiguration(),
                ...(queryDatasetPk !== ''
                    ? [isDefaultDatasetSubtype(quryDatasetSubtype)
                        ? getDatasetByPk(queryDatasetPk)
                        : getResourceByPk(queryDatasetPk)]
                    : [])
            ]))
                .switchMap(([ response, gnLayer ]) => {
                    const mapConfig = options.data || response;
                    const newLayer = gnLayer ? resourceToLayerConfig(gnLayer) : null;
                    const { minx, miny, maxx, maxy } = newLayer?.bbox?.bounds || {};
                    const extent = newLayer?.bbox?.bounds && [ minx, miny, maxx, maxy ];
                    return Observable.of(
                        configureMap(newLayer
                            ? {
                                ...mapConfig,
                                map: {
                                    ...mapConfig?.map,
                                    ...(queryDatasetPk !== undefined && {
                                        visualizationMode: ['3dtiles'].includes(quryDatasetSubtype)
                                            ? VisualizationModes._3D
                                            : VisualizationModes._2D
                                    }),
                                    layers: [
                                        ...(mapConfig?.map?.layers || []),
                                        newLayer
                                    ]
                                }
                            }
                            : mapConfig),
                        ...(extent
                            ? [ setControlProperty(FIT_BOUNDS_CONTROL, 'geometry', extent) ]
                            : []),
                        setControlProperty('toolbar', 'expanded', false)
                    );
                });
        }
    },
    [ResourceTypes.GEOSTORY]: {
        resourceObservable: (pk, options) =>
            Observable.defer(() => getGeoAppByPk(pk))
                .switchMap((resource) => {
                    return Observable.of(
                        setCurrentStory(options.data || resource.data),
                        setResource(resource),
                        setResourceId(pk),
                        setGeoStoryResource({
                            canEdit: resource?.perms?.includes('change_resourcebase')
                        })
                    );
                }),
        newResourceObservable: (options) =>
            Observable.defer(() => getNewGeoStoryConfig())
                .switchMap((gnGeoStory) => {
                    return Observable.of(
                        setCurrentStory(options.data || {...gnGeoStory, sections: [{...gnGeoStory.sections[0], id: uuid(),
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
                .switchMap(( resource ) => {
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
                            options.data ? convertDependenciesMappingForCompatibility(options.data) : convertDependenciesMappingForCompatibility(resource.data)
                        ),
                        setResource(resource),
                        setResourceId(pk)
                    );
                })
                .startWith(dashboardLoading(false)),
        newResourceObservable: (options) =>
            Observable.of(
                resetDashboard(),
                ...(options.data ? [
                    dashboardLoaded(
                        {
                            canDelete: true,
                            canEdit: true
                        },
                        convertDependenciesMappingForCompatibility(options.data)
                    )
                ] : []),
                dashboardLoading(false)
            )
    },
    [ResourceTypes.VIEWER]: {
        resourceObservable: (pk) => {
            return Observable.defer(() =>
                Promise.all([
                    getNewMapConfiguration(),
                    getDefaultPluginsConfig(),
                    getGeoAppByPk(pk)
                ])
            )
                .switchMap(([newMapConfig, pluginsConfig, resource]) => {
                    return Observable.of(
                        setContextCreatorResource({ data: resource.data }, pluginsConfig, null),
                        configureMap(resource?.data?.mapConfig ? resource.data.mapConfig : newMapConfig),
                        enableMandatoryPlugins(),
                        loadFinished(),
                        setCreationStep('configure-plugins'),
                        setResource(resource),
                        setResourceId(pk)
                    );
                });
        },
        newResourceObservable: () => {
            return Observable.defer(() =>
                Promise.all([
                    getNewMapConfiguration(),
                    getDefaultPluginsConfig()
                ])
            )
                .switchMap(([newMapConfig, pluginsConfig]) => {
                    return Observable.of(
                        setContextCreatorResource({ data: { mapConfig: newMapConfig } }, pluginsConfig, null),
                        configureMap(newMapConfig),
                        enableMandatoryPlugins(),
                        loadFinished(),
                        setCreationStep('configure-plugins')
                    );
                });
        },
        linkedResourceObservable: (payload) => {
            const {response, source} = payload;
            const { success, error: [error] } = response;
            if (success) {
                // redirect to map resource
                const redirectUrl = window.location.href.replace(/(#).*/, '$1' + `/map/${source}`);
                window.location.replace(parseDevHostname(redirectUrl));
                window.location.reload();
                return Observable.empty();
            }
            return Observable.throw(new Error(error));
        },
        removeLinkedResourceObservable: (payload) => {
            const { response } = payload;
            const { success, error: [error] } = response;
            if (success) {
                window.location.replace(window.location.href);
                window.location.reload();
                return Observable.empty();
            }
            return Observable.throw(new Error(error));
        }
    }
};

// collect all the reset action needed before changing a viewer
const getResetActions = (state, isSameResource) => {
    const initialResource = state?.gnresource?.initialResource;
    const initialLayer = getInitialDatasetLayer(state);
    return [
        resetControls(),
        ...(!isSameResource
            ? [ resetResourceState() ]
            : [
                ...(initialResource ? [setResource(initialResource)] : []),
                ...(initialLayer ? [setSelectedLayer(initialLayer), updateNode(initialLayer.layerId, 'layers', initialLayer)] : [])
            ]
        ),
        setControlProperty('rightOverlay', 'enabled', false),
        setControlProperty(FIT_BOUNDS_CONTROL, 'geometry', null),
        // reset style editor state to avoid persistence service configuration in between resource pages
        initStyleService(),
        resetStyleEditor(),
        hideSettings()
    ];
};

export const gnViewerRequestNewResourceConfig = (action$, store) =>
    action$.ofType(REQUEST_NEW_RESOURCE_CONFIG)
        .switchMap((action) => {
            const { newResourceObservable } = resourceTypes[action.resourceType] || {};
            const state = store.getState();
            if (!canAddResource(state)) {
                const pathname = state?.router?.location?.pathname;
                const formattedUrl = url.format({
                    ...window.location,
                    pathname: '/account/login/',
                    hash: '',
                    search: `?next=${getCataloguePath('/catalogue')}${pathname ? `/#${pathname}` : ''}`
                });
                window.location.href = formattedUrl;
                window.reload();
                return Observable.empty();
            }

            const { query = {} } = url.parse(state?.router?.location?.search, true) || {};

            if (!newResourceObservable) {
                return Observable.of(
                    ...getResetActions(),
                    loadingResourceConfig(false)
                );
            }

            return Observable.concat(
                Observable.of(
                    ...getResetActions(),
                    loadingResourceConfig(true),
                    setNewResource(),
                    setResourceType(action.resourceType),
                    setResourcePathParameters(action?.options?.params)
                ),
                newResourceObservable({ query }),
                Observable.of(
                    loadingResourceConfig(false)
                )
            )
                .catch((error) => {
                    return Observable.of(
                        ...getResetActions(),
                        resourceConfigError(error?.data?.detail || error?.statusText || error?.message)
                    );
                });
        });

export const gnViewerRequestResourceConfig = (action$, store) =>
    action$.ofType(REQUEST_RESOURCE_CONFIG)
        .switchMap((action) => {

            const state = store.getState();

            const { resourceObservable } = resourceTypes[action.resourceType] || {};

            if (!resourceObservable) {
                return Observable.of(
                    ...getResetActions(),
                    loadingResourceConfig(false)
                );
            }
            const { query = {} } = url.parse(searchSelector(state), true) || {};
            const resourceData = getResourceData(state);
            const isSamePreviousResource = !resourceData?.['@ms-detail'] && resourceData?.pk === action.pk;
            return Observable.concat(
                Observable.of(
                    ...getResetActions(state, isSamePreviousResource),
                    loadingResourceConfig(true),
                    setResourceType(action.resourceType),
                    setResourcePathParameters(action?.options?.params)
                ),
                ...((!isSamePreviousResource && !!isLoggedIn(state))
                    ? [
                        Observable.defer(() => getCompactPermissionsByPk(action.pk))
                            .switchMap((compactPermissions) => {
                                return Observable.of(setResourceCompactPermissions(compactPermissions));
                            })
                            .catch(() => {
                                return Observable.empty();
                            })
                    ]
                    : []),
                resourceObservable(action.pk, {
                    ...action.options,
                    isSamePreviousResource,
                    resourceData,
                    selectedLayer: isSamePreviousResource && getInitialDatasetLayer(state),
                    params: {...action?.options?.params, query}
                }),
                Observable.of(
                    loadingResourceConfig(false)
                )
            )
                .catch((error) => {
                    return Observable.of(
                        ...getResetActions(),
                        resourceConfigError(error?.data?.detail || error?.statusText || error?.message)
                    );
                });
        });

export const gnViewerSetNewResourceThumbnail = (action$, store) =>
    action$.ofType(SET_RESOURCE_THUMBNAIL)
        .switchMap(() => {
            const state = store.getState();
            const newThumbnailData = getResourceThumbnail(state);
            const resourceIDThumbnail = getResourceId(state);
            const currentResource = state.gnresource?.data || {};

            const body = { file: newThumbnailData };
            const deleteThumbnail = !newThumbnailData;
            const successMsgId = `gnviewer.${deleteThumbnail ? "thumbnailRemoved" : "thumbnailsaved"}`;

            return Observable.defer(() => deleteThumbnail ? deleteResourceThumbnail(resourceIDThumbnail) : setResourceThumbnail(resourceIDThumbnail, body))
                .switchMap((res) => {
                    return Observable.of(updateResourceProperties({ ...currentResource, thumbnail_url: res.thumbnail_url, thumbnailChanged: false, updatingThumbnail: false }), updateResource({ ...currentResource, thumbnail_url: res.thumbnail_url }),
                        successNotification({ title: successMsgId, message: successMsgId }));
                }).catch((error) => {
                    return Observable.of(
                        saveError(error.data || error.message),
                        errorNotification({ title: "map.mapError.errorTitle", message: "map.mapError.errorDefault" })
                    );
                });
        });

export const closeInfoPanelOnMapClick = (action$, store) => action$.ofType(CLICK_ON_MAP)
    .filter(() => store.getState().controls?.rightOverlay?.enabled === 'Share')
    .switchMap(() => Observable.of(setControlProperty('rightOverlay', 'enabled', false)));


// Check which control is enabled between annotations and datasetsCatlog
const oneOfTheOther = (control) => {
    if (control === 'rightOverlay') return null;
    return {
        control,
        alternate: control === 'annotations' ? 'datasetsCatalog' : 'annotations'
    };
};

/**
 * Close open panels on new panel open
 */
export const closeOpenPanels = (action$, store) => action$.ofType(SET_CONTROL_PROPERTY, SET_SHOW_DETAILS)
    .filter((action) => !!action.value || action.show)
    .switchMap((action) => {
        const state = store.getState();
        const getActions = () => {
            const setActions = [];
            if (isMapInfoOpen(state)) {
                setActions.push(purgeMapInfoResults(), closeIdentify());
            }
            const isDatasetCatalogPanelOpen = get(state, "controls.datasetsCatalog.enabled");
            const isCatalogOpen = get(state, "controls.metadataexplorer.enabled");
            const isVisualStyleEditorOpen = get(state, "controls.visualStyleEditor.enabled");
            if ((isDatasetCatalogPanelOpen || isVisualStyleEditorOpen) && isCatalogOpen) {
                setActions.push(catalogClose());
            }
            if (isDatasetCatalogPanelOpen && isVisualStyleEditorOpen) {
                setActions.push(setControlProperty('datasetsCatalog', 'enabled', false));
            }
            const isResourceDetailsOpen = !action.show && getShowDetails(state);
            if (isResourceDetailsOpen) {
                setActions.push(setShowDetails(false));
            }
            const control = oneOfTheOther(action.control);
            if (control?.control || action.show) {
                if (state.controls?.rightOverlay?.enabled === 'Share') {
                    setActions.push(setControlProperty('rightOverlay', 'enabled', false));
                } else if (!!state.controls?.[`${control.alternate}`]?.enabled) {
                    setActions.push(setControlProperty(`${control.alternate}`, 'enabled', false));
                }
            }
            return setActions;
        };
        const actions = getActions();
        return actions.length > 0 ? Observable.of(...actions) : Observable.empty();
    });

/**
 * Close dataset panels on map info panel open
 */
export const closeDatasetCatalogPanel = (action$, store) => action$.ofType(NEW_MAPINFO_REQUEST)
    .filter(() => isMapInfoOpen(store.getState()) && get(store.getState(), "controls.datasetsCatalog.enabled"))
    .switchMap(() => {
        return Observable.of(setControlProperty('datasetsCatalog', 'enabled', false));
    });

export const closeResourceDetailsOnMapInfoOpen = (action$, store) => action$.ofType(NEW_MAPINFO_REQUEST)
    .filter(() => isMapInfoOpen(store.getState()) && getShowDetails(store.getState()))
    .mapTo(setShowDetails(false));

export const gnManageLinkedResource = (action$, store) =>
    action$.ofType(MANAGE_LINKED_RESOURCE)
        .switchMap((action) => {
            const state = store.getState();
            const resource = state.gnresource ?? {};
            const params = state?.gnresource?.params;
            const { source, target, resourceType, processType } = action.payload;
            const isLinkResource = processType === ProcessTypes.LINK_RESOURCE;
            const resourceObservable = resourceTypes[resourceType];
            let observable$ = resourceObservable?.linkedResourceObservable;
            let linkedResourceFn = setLinkedResourcesByPk;
            if (!isLinkResource) {
                observable$ = resourceObservable?.removeLinkedResourceObservable;
                linkedResourceFn = removeLinkedResourcesByPk;
            }
            return Observable.concat(
                ...(isLinkResource ? [Observable.of(setResourcePathParameters({ ...params, pk: target}))] : []),
                Observable.defer(() => linkedResourceFn(source, target))
                    .switchMap((response) =>
                        Observable.concat(
                            observable$({response, source, resource}),
                            Observable.of(
                                successNotification({
                                    title: "gnviewer.linkedResource.title",
                                    message: `gnviewer.linkedResource.message.success.${processType}`}
                                ))
                        )).catch(() => Observable.of(errorNotification({
                        title: "gnviewer.linkedResource.title",
                        message: `gnviewer.linkedResource.message.failure.${processType}`
                    })))
                    .let(wrapStartStop(
                        setControlProperty(processType, 'loading', true),
                        setControlProperty(processType, 'loading', false)
                    ))
            );
        });

const MAX_EXTENT_WEB_MERCATOR = [-180, -85, 180, 85];

function validateGeometry(extent, projection) {
    if (extent && ['EPSG:900913', 'EPSG:3857'].includes(projection)) {
        const [minx, miny, maxx, maxy] = extent;
        const [eMinx, eMiny, eMaxx, eMaxy] = MAX_EXTENT_WEB_MERCATOR;
        return [
            minx < eMinx ? eMinx : minx,
            (miny < eMiny || miny > eMaxy) ? eMiny : miny,
            maxx > eMaxx ? eMaxx : maxx,
            (maxy > eMaxy || maxy < eMiny) ? eMaxy : maxy
        ];
    }
    return extent;
}

export const gnZoomToFitBounds = (action$) =>
    action$.ofType(SET_CONTROL_PROPERTY)
        .filter(action => action.control === FIT_BOUNDS_CONTROL && !!action.value)
        .switchMap((action) =>
            action$.ofType(CHANGE_MAP_VIEW)
                .take(1)
                .switchMap(() => {
                    const extent = validateGeometry(action.value);
                    return Observable.of(
                        zoomToExtent(extent, 'EPSG:4326', undefined, { duration: 0 }),
                        setControlProperty(FIT_BOUNDS_CONTROL, 'geometry', null)
                    );
                })
        );

const getResourceWithDetail = (resource) => ({
    ...resource,
    /* store information related to detail */
    '@ms-detail': true
});
export const gnSelectResourceEpic = (action$, store) =>
    action$.ofType(REQUEST_RESOURCE)
        .switchMap(action => {
            const selectedResource = action?.resource;
            if (isNil(selectedResource?.pk)) {
                return Observable.of(
                    setResource(null),
                    setResourceCompactPermissions(undefined)
                );
            }
            const state = store.getState();
            const user = userSelector(state);
            const { resource_type: resourceType, pk, subtype } = selectedResource;
            const _selectedResource = getResourceWithDetail(selectedResource);
            const initialActions = !_selectedResource ? [] : [
                setResource(_selectedResource, true),
                setSelectedResource(_selectedResource)
            ];
            return Observable.defer(() => Promise.all([
                getResourceByTypeAndByPk(resourceType, pk, subtype),
                user
                    ? getCompactPermissionsByPk(pk)
                        .then((compactPermissions) => compactPermissions)
                        .catch(() => null)
                    : Promise.resolve(null)
            ]))
                .switchMap(([resource, compactPermissions]) => {
                    return Observable.of(
                        setResourceType(resourceType),
                        setResource(getResourceWithDetail(resource)),
                        ...(compactPermissions ? [setResourceCompactPermissions(compactPermissions)] : [])
                    );
                })
                .catch((error) => {
                    return Observable.of(resourceError(error.data || error.message));
                })
                .startWith(
                    // preload the resource if available
                    ...initialActions,
                    resourceLoading()
                );
        });

export default {
    gnViewerRequestNewResourceConfig,
    gnViewerRequestResourceConfig,
    gnViewerSetNewResourceThumbnail,
    closeInfoPanelOnMapClick,
    closeOpenPanels,
    closeDatasetCatalogPanel,
    closeResourceDetailsOnMapInfoOpen,
    gnManageLinkedResource,
    gnZoomToFitBounds,
    gnSelectResourceEpic
};
