/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import axios from '@mapstore/framework/libs/ajax';
import { v4 as uuid } from "uuid";
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
    deleteResourceThumbnail,
    updateResourceExtent
} from '@js/api/geonode/v2';
import { configureMap, MAP_CONFIG_LOADED } from '@mapstore/framework/actions/config';
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
    setSelectedLayer,
    UPDATE_RESOURCE_EXTENT,
    updateResourceExtentLoading,
    setDatasetEditPermissionsError,
    LOADING_RESOURCE_CONFIG
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

import { SAVE_SUCCESS } from '@mapstore/framework/actions/featuregrid';

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
    isDefaultDatasetSubtype,
    resourceHasPermission,
    canEditMap,
    parseMapLayerData
} from '@js/utils/ResourceUtils';
import {
    canAddResource,
    getInitialDatasetLayer,
    getInitialDatasetLayerStyle,
    getMapLayerData,
    getResourceData,
    getResourceId,
    getResourceThumbnail
} from '@js/selectors/resource';
import { updateAdditionalLayer } from '@mapstore/framework/actions/additionallayers';
import { STYLE_OWNER_NAME } from '@mapstore/framework/utils/StyleEditorUtils';
import { initStyleService, resetStyleEditor } from '@mapstore/framework/actions/styleeditor';
import { CLICK_ON_MAP, resizeMap, zoomToExtent, MAP_PLUGIN_LOAD } from '@mapstore/framework/actions/map';
import { purgeMapInfoResults, closeIdentify, NEW_MAPINFO_REQUEST } from '@mapstore/framework/actions/mapInfo';
import { saveError } from '@js/actions/gnsave';
import {
    error as errorNotification,
    success as successNotification,
    warning as warningNotification
} from '@mapstore/framework/actions/notifications';
import {
    convertDependenciesMappingForCompatibility,
    updateDependenciesForMultiViewCompatibility
} from '@mapstore/framework/utils/WidgetsUtils';
import {
    setResource as setContextCreatorResource,
    enableMandatoryPlugins,
    loadFinished,
    setCreationStep
} from '@mapstore/framework/actions/contextcreator';
import { setContext, setResource as setResourceContext } from '@mapstore/framework/actions/context';
import { REDUCERS_LOADED } from '@mapstore/framework/actions/storemanager';
import { wrapStartStop } from '@mapstore/framework/observables/epics';
import { parseDevHostname } from '@js/utils/APIUtils';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { catalogClose, addLayerAndDescribe } from '@mapstore/framework/actions/catalog';
import { VisualizationModes } from '@mapstore/framework/utils/MapTypeUtils';
import { forceUpdateMapLayout } from '@mapstore/framework/actions/maplayout';
import { getShowDetails } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import { searchSelector } from '@mapstore/framework/selectors/router';
import { CREATE_BACKGROUNDS_LIST, allowBackgroundsDeletion } from '@mapstore/framework/actions/backgroundselector';
import { setCanEditProjection, setProjectionsConfig } from '@mapstore/framework/plugins/CRSSelector/actions/crsselector';
import { getResolutionsForProjection, getZoomFromResolution } from '@mapstore/framework/utils/MapUtils';
import { reprojectBbox } from '@mapstore/framework/utils/CoordinatesUtils';

import { LOGIN_URL } from '@js/api/geonode/v2/constants';

// Wait for the Map plugin to finish mounting before dispatching zoomToExtent.
// Navigating between dataset pages (e.g. dataset_viewer -> dataset_edit_data_viewer)
// changes the PluginsContainer key in routes/Viewer.jsx, so React tears down and
// re-mounts the entire plugin tree, which includes re-registering the OL
// ZOOM_TO_EXTENT_HOOK. MAP_PLUGIN_LOAD with loaded=true fires once that re-mount
// completes; a small post-delay covers the OL component's own componentDidMount.
// The timer is a fallback for the case where the plugin tree is reused and
// MAP_PLUGIN_LOAD doesn't re-fire.
const fitBoundsAfterMapReady = (action$, extent) =>
    extent
        ? Observable.race(
            action$.ofType(MAP_PLUGIN_LOAD).filter(a => a.loaded).take(1).delay(100),
            Observable.timer(800)
        ).map(() => zoomToExtent(extent, 'EPSG:4326', undefined, { duration: 0 })) // ste duration to 0 to avoid problem with 3D mdoe
        : Observable.empty();

const DATASET_FALLBACK_ZOOM = 20;
const REFERENCE_SIZE = 768; // notional viewport size in px

const getApproximateViewForExtent = (extent4326, projection = 'EPSG:3857') => {
    const [minx, miny, maxx, maxy] = extent4326 || [];
    const center = {
        x: (minx + maxx) / 2,
        y: (miny + maxy) / 2,
        crs: 'EPSG:4326'
    };
    const projExtent = reprojectBbox(extent4326, 'EPSG:4326', projection);
    const extentWidth = projExtent && projExtent[2] - projExtent[0];
    const extentHeight = projExtent && projExtent[3] - projExtent[1];
    const zoom = extentWidth > 0 && extentHeight > 0
        ? getZoomFromResolution(
            Math.max(extentWidth, extentHeight) / REFERENCE_SIZE,
            getResolutionsForProjection(projection)
        )
        : DATASET_FALLBACK_ZOOM;
    return { center, zoom };
};

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
                        if (gnLayer?.has_time && resourceHasPermission(gnLayer, 'change_resourcebase')) {
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
                        // On same-resource transitions `gnLayer` is the resource record
                        // currently in state, which the SET_RESOURCE reducer has already
                        // stripped of its `data` field. Source the dataset payload from
                        // the dedicated `mapLayerData` slice instead.
                        const mapLayerData = options?.isSamePreviousResource
                            ? options.mapLayerData
                            : parseMapLayerData(gnLayer?.data);
                        return [mapConfig, {...gnLayer, timeseries}, newLayer, mapLayerData];
                    })
            )
                .switchMap((response) => {
                    const [mapConfig, gnLayer, newLayer, mapLayerData] = response;
                    const {minx, miny, maxx, maxy } = newLayer?.bbox?.bounds || {};
                    const extent = newLayer?.bbox?.bounds && [minx, miny, maxx, maxy ];
                    const hasNoGeometry = gnLayer?.subtype === 'tabular';
                    const hasDownloadPermission = gnLayer?.perms?.includes('download_resourcebase');
                    const isNewLoad = !options?.isSamePreviousResource;

                    // page-specific layer actions shared between the two paths
                    const pageSpecificActions = [
                        selectNode(newLayer.id, 'layer', false),
                        ...((hasNoGeometry || page === 'dataset_edit_data_viewer')
                            ? [
                                browseData(newLayer),
                                ...(hasDownloadPermission ? [] : [setDatasetEditPermissionsError('gnviewer.noEditPermissions')])
                            ]
                            : []),
                        ...(page === 'dataset_edit_layer_settings'
                            ? [
                                showSettings(newLayer.id, "layers", {opacity: newLayer.opacity ?? 1}),
                                setControlProperty("layersettings", "activeTab", query.tab ?? "general"),
                                updateAdditionalLayer(newLayer.id, STYLE_OWNER_NAME, 'override', {}),
                                resizeMap()
                            ]
                            : [])
                    ];

                    const projection = mapLayerData?.mapConfig?.map?.projection || mapConfig.map?.projection || 'EPSG:3857';
                    // try to center the map on the correct location and zoom level
                    const initialView = extent
                        ? getApproximateViewForExtent(extent, projection)
                        : { zoom: DATASET_FALLBACK_ZOOM };

                    return Observable.concat(
                        Observable.of(
                            configureMap({
                                ...mapConfig,
                                map: {
                                    ...mapConfig.map,
                                    ...mapLayerData?.mapConfig?.map,
                                    ...initialView,
                                    visualizationMode: ['3dtiles'].includes(subtype) ? VisualizationModes._3D : VisualizationModes._2D,
                                    // on same-resource navigation the layer is already described;
                                    // on new loads it is added via addLayerAndDescribe below
                                    layers: [
                                        ...mapConfig.map.layers,
                                        ...(!isNewLoad ? [{ ...newLayer, isDataset: true, _v_: Date.now() }] : [])
                                    ]
                                }
                            }),
                            // Always dispatch — an undefined payload resets the slice so a
                            // projection list from a previously-loaded dataset does not leak
                            // into a dataset that has no persisted crsSelector config.
                            setProjectionsConfig(mapLayerData?.mapConfig?.crsSelector),
                            setControlProperty('toolbar', 'expanded', false),
                            forceUpdateMapLayout(),
                            // on new loads: configureMap (= MAP_CONFIG_LOADED) has already updated
                            // the layers state, so addLayerAndDescribe safely appends + describes
                            ...(isNewLoad
                                ? [addLayerAndDescribe({ ...newLayer, isDataset: true, _v_: Date.now() }, { zoomToLayer: false })]
                                : []
                            ),
                            ...pageSpecificActions,
                            ...(isNewLoad ? [setResource({...gnLayer, hasNoGeometry})] : []),
                            setResourceId(pk),
                            ...(newLayer?.bboxError
                                ? [warningNotification({ title: "gnviewer.invalidBbox", message: "gnviewer.invalidBboxMsg" })]
                                : []),
                            // unblock the Viewer route so the Map plugin actually mounts
                            // before fitBoundsAfterMapReady fires the deferred zoomToExtent;
                            // otherwise the ZOOM_TO_EXTENT hook is not registered and the
                            // fit falls back to legacyZoomToExtent against default state.
                            loadingResourceConfig(false)
                        ),
                        fitBoundsAfterMapReady(options.action$, extent)
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
            ]))
                .switchMap(([baseConfig, resource]) => {
                    const [mapResource, mapViewerResource] = resource ?? [];
                    const viewerData = mapViewerResource?.data ?? null;
                    const viewerPk = mapViewerResource?.pk;
                    const mapConfig = options.data
                        ? options.data
                        : toMapStoreMapConfig(mapResource, baseConfig);

                    const initialActions = Observable.of(
                        setContext(viewerData),
                        setResourceId(pk),
                        setResource(mapResource),
                        setMapViewerLinkedResource(mapViewerResource),
                        setResourcePathParameters({
                            ...options?.params,
                            appPk: viewerPk,
                            hasViewer: !!viewerPk
                        }),
                        setControlProperty("toolbar", "expanded", false)
                    );

                    // Wait for module plugin reducers to load before configuring map
                    // This ensures dynamic plugin reducers are ready to restore state
                    const waitForReducers$ = viewerData && options?.action$
                        ? Observable.race(
                            options.action$.ofType(REDUCERS_LOADED).take(1),
                            Observable.timer(5000) // timeout as safety fallback only
                        ) : Observable.of(null);

                    return Observable.concat(initialActions, waitForReducers$.map(() => configureMap(mapConfig)));
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
                    return Observable.concat(
                        Observable.of(
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
                                        // configureMap (= MAP_CONFIG_LOADED) updates the layers state
                                        // synchronously, so addLayerAndDescribe below safely appends + describes
                                        layers: [...(mapConfig?.map?.layers || [])]
                                    }
                                }
                                : mapConfig),
                            ...(newLayer ? [addLayerAndDescribe(newLayer, { zoomToLayer: false })] : []),
                            setControlProperty('toolbar', 'expanded', false),
                            // unblock the Viewer route so the Map plugin actually mounts;
                            // see fitBoundsAfterMapReady comment.
                            loadingResourceConfig(false)
                        ),
                        fitBoundsAfterMapReady(options.action$, extent)
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
                    const currentStory = options.data || {...gnGeoStory, sections: [{...gnGeoStory.sections[0], id: uuid(),
                        contents: [{...gnGeoStory.sections[0].contents[0], id: uuid()}]}]};
                    return Observable.of(
                        setCurrentStory({...currentStory, defaultGeoStoryConfig: {...currentStory}}),
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
                            options.data
                                ? updateDependenciesForMultiViewCompatibility(convertDependenciesMappingForCompatibility(options.data))
                                : updateDependenciesForMultiViewCompatibility(convertDependenciesMappingForCompatibility(resource.data))
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
                        updateDependenciesForMultiViewCompatibility(convertDependenciesMappingForCompatibility(options.data))
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
                    pathname: LOGIN_URL,
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
                newResourceObservable({ query, action$ }),
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
                    mapLayerData: getMapLayerData(state),
                    selectedLayer: isSamePreviousResource && {...getInitialDatasetLayer(state), style: getInitialDatasetLayerStyle(state)},
                    params: {...action?.options?.params, query},
                    action$
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


// Check which control is enabled between annotations, metadataexplorer and documentsCatalog
const oneOfTheOther = (control) => {
    if (control === 'rightOverlay') return null;

    // Handle three-way alternates
    if (control === 'annotations') {
        return {
            control,
            alternates: ['metadataexplorer', 'documentsCatalog']
        };
    }
    if (control === 'metadataexplorer') {
        return {
            control,
            alternates: ['annotations', 'documentsCatalog']
        };
    }
    if (control === 'documentsCatalog') {
        return {
            control,
            alternates: ['annotations', 'metadataexplorer']
        };
    }

    return {
        control,
        alternates: []
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
            const isDocumentsCatalogPanelOpen = get(state, "controls.documentsCatalog.enabled");
            const isCatalogOpen = get(state, "controls.metadataexplorer.enabled");
            const isVisualStyleEditorOpen = get(state, "controls.visualStyleEditor.enabled");
            if (isVisualStyleEditorOpen && isCatalogOpen) {
                setActions.push(catalogClose());
            }
            if (isDocumentsCatalogPanelOpen && isVisualStyleEditorOpen) {
                setActions.push(setControlProperty('documentsCatalog', 'enabled', false));
            }
            const isResourceDetailsOpen = !action.show && getShowDetails(state);
            if (isResourceDetailsOpen) {
                setActions.push(setShowDetails(false));
            }
            const control = oneOfTheOther(action.control);
            if (control?.control || action.show) {
                if (state.controls?.rightOverlay?.enabled === 'Share') {
                    setActions.push(setControlProperty('rightOverlay', 'enabled', false));
                } else {
                    // Close all alternate panels
                    control.alternates?.forEach(alternate => {
                        if (state.controls?.[alternate]?.enabled) {
                            setActions.push(setControlProperty(alternate, 'enabled', false));
                        }
                    });
                }
            }
            return setActions;
        };
        const actions = getActions();
        return actions.length > 0 ? Observable.of(...actions) : Observable.empty();
    });

/**
 * Close catalog and documents panels on map info panel open
 */
export const closeDatasetCatalogPanel = (action$, store) => action$.ofType(NEW_MAPINFO_REQUEST)
    .filter(() => {
        const state = store.getState();
        return isMapInfoOpen(state) &&
               (get(state, "controls.metadataexplorer.enabled") ||
                get(state, "controls.documentsCatalog.enabled"));
    })
    .switchMap(() => {
        const state = store.getState();
        const actions = [];

        if (get(state, "controls.metadataexplorer.enabled")) {
            actions.push(catalogClose());
        }

        if (get(state, "controls.documentsCatalog.enabled")) {
            actions.push(setControlProperty('documentsCatalog', 'enabled', false));
        }

        return Observable.of(...actions);
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
            ])
                .then((response) => {
                    const [resource] = response ?? [];
                    if (resource?.has_time && resourceHasPermission(resource, 'change_resourcebase')) {
                        return getDatasetTimeSettingsByPk(pk)
                            .then((timeseries) => response.concat(timeseries));
                    }
                    return response;
                }))
                .switchMap((response) => {
                    const [resource, compactPermissions, timeseries] = response ?? [];
                    return Observable.of(
                        setResourceType(resourceType),
                        setResource(getResourceWithDetail({...resource, timeseries})),
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

export const gnUpdateResourceExtent = (action$, store) =>
    action$.ofType(UPDATE_RESOURCE_EXTENT, SAVE_SUCCESS)
        .switchMap((action) => {
            const state = store.getState();
            const currentResource = state.gnresource?.data || {};
            const shouldNotify = action.type === UPDATE_RESOURCE_EXTENT;
            return Observable.concat(
                Observable.of(updateResourceExtentLoading(true)),
                Observable.defer(() =>
                    updateResourceExtent(currentResource?.pk)
                        .then(() => getResourceByPk(currentResource?.pk))
                        .then((updatedResource) => {
                            const { extent } = updatedResource || {};
                            return extent;
                        })
                )
                    .switchMap((extent) =>
                        Observable.of(
                            updateResourceExtentLoading(false),
                            ...(shouldNotify ? [successNotification({
                                title: "gnviewer.updateBoundingBox",
                                message: "gnviewer.updateBoundingBoxSuccess"
                            })] : []),
                            ...(extent ? [
                                updateResourceProperties({
                                    extent
                                })
                            ] : [])
                        )
                    )
                    .catch(() =>
                        Observable.of(
                            updateResourceExtentLoading(false),
                            ...(shouldNotify ? [errorNotification({
                                title: "gnviewer.updateBoundingBox",
                                message: "gnviewer.updateBoundingBoxError"
                            })] : [])
                        )
                    )
            );
        });

export const gnUpdateBackgroundEditEpic = (action$, store) =>
    action$.ofType(CREATE_BACKGROUNDS_LIST)
        .switchMap(() => {
            const state = store.getState();
            const canEdit = canEditMap(state.gnresource);
            return Observable.of(
                setResourceContext({ canEdit }),
                ...(canEdit ? [allowBackgroundsDeletion(true)] : [])
            );
        });

export const gnUpdateEditProjectionEpic = (action$, store) =>
    action$.ofType(MAP_CONFIG_LOADED, LOADING_RESOURCE_CONFIG)
        .switchMap(() => {
            const state = store.getState();
            const canEdit = canEditMap(state.gnresource, { isNewCheck: true, resourceTypes: [ResourceTypes.MAP, ResourceTypes.DATASET] });
            return Observable.of(setCanEditProjection(canEdit));
        });

export default {
    gnViewerRequestNewResourceConfig,
    gnViewerRequestResourceConfig,
    gnViewerSetNewResourceThumbnail,
    gnUpdateBackgroundEditEpic,
    closeInfoPanelOnMapClick,
    closeOpenPanels,
    closeDatasetCatalogPanel,
    closeResourceDetailsOnMapInfoOpen,
    gnManageLinkedResource,
    gnSelectResourceEpic,
    gnUpdateResourceExtent,
    gnUpdateEditProjectionEpic
};
