/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isFunction from 'lodash/isFunction';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import {
    PrintActionButton,
    CatalogActionButton,
    MeasureActionButton,
    LayerDownloadActionButton,
    AnnotationsActionButton,
    FullScreenActionButton,
    FilterLayerActionButton
} from '@js/plugins/actionnavbar/buttons';
import { getMetadataUrl,
    getMetadataDetailUrl,
    resourceHasPermission,
    canCopyResource } from '@js/utils/ResourceUtils';

const EXCLUDED_EPICS_NAMES = [
    'loadGeostoryEpic',
    'reloadGeoStoryOnLoginLogout',
    'loadStoryOnHistoryPop',
    'saveGeoStoryResource'
];

function cleanEpics(epics, excludedNames = EXCLUDED_EPICS_NAMES) {
    const containsExcludedEpic = !!excludedNames.find((epicName) => epics[epicName]);
    if (containsExcludedEpic) {
        return omit(epics, excludedNames);
    }
    return epics;
}

function toLazyPlugin(name, implFunc, overrides) {
    const getLazyPlugin = () => {
        return implFunc().then((mod) => {
            const impl = mod.default;
            const pluginName = name + 'Plugin';
            if (!isFunction(impl[pluginName])) {
                const {
                    enabler,
                    loadPlugin,
                    disablePluginIf,
                    ...containers
                } = impl[pluginName];
                return {
                    'default': merge({
                        name,
                        component: impl[pluginName],
                        reducers: impl.reducers || {},
                        epics: cleanEpics(impl.epics || {}),
                        containers,
                        disablePluginIf,
                        enabler,
                        loadPlugin
                    }, overrides)
                };
            }
            return {
                'default': merge({
                    name,
                    component: impl[pluginName],
                    reducers: impl.reducers || {},
                    epics: cleanEpics(impl.epics || {}),
                    containers: impl.containers || {}
                }, overrides)
            };
        });
    };
    getLazyPlugin.isGNLazyWrapper = true;
    return getLazyPlugin;
}


function splitLazyAndStaticPlugins(pluginsDefinition) {
    const { plugins: allPlugins = {}, ...definition } = pluginsDefinition;
    const plugins = Object.keys(allPlugins)
        .filter((name) => !allPlugins[name].isGNLazyWrapper)
        .reduce((acc, name) => ({
            ...acc,
            [name]: allPlugins[name]
        }), {});
    const lazyPlugins = Object.keys(allPlugins)
        .filter((name) => allPlugins[name].isGNLazyWrapper)
        .reduce((acc, name) => ({
            ...acc,
            [name]: allPlugins[name]
        }), {});
    return {
        ...definition,
        plugins,
        lazyPlugins
    };
}

// this plugins index combined with the hook `useLazyPlugins`
// provides a way to import dynamically plugins similar to extensions

export const plugins = {
    LayerDownloadPlugin: toLazyPlugin(
        'LayerDownload',
        () => import(/* webpackChunkName: 'plugins/layer-download' */ '@mapstore/framework/plugins/LayerDownload'),
        {
            containers: {
                ActionNavbar: {
                    name: 'LayerDownload',
                    Component: LayerDownloadActionButton
                }
            }
        }
    ),
    SwipePlugin: toLazyPlugin(
        'Swipe',
        () => import(/* webpackChunkName: 'plugins/swipe' */ '@mapstore/framework/plugins/Swipe')
    ),
    SearchServicesConfigPlugin: toLazyPlugin(
        'SearchServicesConfig',
        () => import(/* webpackChunkName: 'plugins/search-service-config' */ '@mapstore/framework/plugins/SearchServicesConfig')
    ),
    MousePositionPlugin: toLazyPlugin(
        'MousePosition',
        () => import(/* webpackChunkName: 'plugins/mouse-position' */ '@mapstore/framework/plugins/MousePosition')
    ),
    StyleEditorPlugin: toLazyPlugin(
        'StyleEditor',
        () => import(/* webpackChunkName: 'plugins/style-editor' */ '@mapstore/framework/plugins/StyleEditor')
    ),
    MetadataExplorerPlugin: toLazyPlugin(
        'MetadataExplorer',
        () => import(/* webpackChunkName: 'plugins/metadata-explorer' */ '@mapstore/framework/plugins/MetadataExplorer'),
        {
            containers: {
                ActionNavbar: {
                    name: 'Catalog',
                    Component: CatalogActionButton,
                    priority: 1,
                    doNotHide: true
                },
                TOC: {
                    priority: 1,
                    doNotHide: true
                }
            }
        }
    ),
    QueryPanelPlugin: toLazyPlugin(
        'QueryPanel',
        () => import(/* webpackChunkName: 'plugins/query-panel' */ '@mapstore/framework/plugins/QueryPanel')
    ),
    FeatureEditorPlugin: toLazyPlugin(
        'FeatureEditor',
        () => import(/* webpackChunkName: 'plugins/feature-editor-plugin' */ '@mapstore/framework/plugins/FeatureEditor')
    ),
    WidgetsTrayPlugin: toLazyPlugin(
        'WidgetsTray',
        () => import(/* webpackChunkName: 'plugins/widgets-tray-plugin' */ '@mapstore/framework/plugins/WidgetsTray')
    ),
    WidgetsBuilderPlugin: toLazyPlugin(
        'WidgetsBuilder',
        () => import(/* webpackChunkName: 'plugins/widgets-builder-plugin' */ '@mapstore/framework/plugins/WidgetsBuilder')
    ),
    WidgetsPlugin: toLazyPlugin(
        'Widgets',
        () => import(/* webpackChunkName: 'plugins/widgets-plugin' */ '@mapstore/framework/plugins/Widgets')
    ),
    TOCItemsSettingsPlugin: toLazyPlugin(
        'TOCItemsSettings',
        () => import(/* webpackChunkName: 'plugins/toc-items-settings-plugin' */ '@mapstore/framework/plugins/TOCItemsSettings')
    ),
    FilterLayerPlugin: toLazyPlugin(
        'FilterLayer',
        () => import(/* webpackChunkName: 'plugins/filter-layer-plugin' */ '@mapstore/framework/plugins/FilterLayer'),
        {
            containers: {
                ActionNavbar: {
                    name: 'FilterLayer',
                    Component: FilterLayerActionButton,
                    priority: 1
                },
                TOC: {
                    name: "FilterLayer",
                    priority: 2
                }
            }
        }
    ),
    MeasurePlugin: toLazyPlugin(
        'Measure',
        () => import(/* webpackChunkName: 'plugins/measure-plugin' */ '@mapstore/framework/plugins/Measure'),
        {
            containers: {
                ActionNavbar: {
                    name: 'Measure',
                    Component: MeasureActionButton
                }
            }
        }
    ),
    FullScreenPlugin: toLazyPlugin(
        'FullScreen',
        () => import(/* webpackChunkName: 'plugins/fullscreen-plugin' */ '@mapstore/framework/plugins/FullScreen'),
        {
            containers: {
                ActionNavbar: {
                    name: 'FullScreen',
                    Component: FullScreenActionButton,
                    priority: 5
                }
            }
        }
    ),
    AddGroupPlugin: toLazyPlugin(
        'AddGroup',
        () => import(/* webpackChunkName: 'plugins/add-group-plugin' */ '@mapstore/framework/plugins/AddGroup')
    ),
    OmniBarPlugin: toLazyPlugin(
        'OmniBar',
        () => import(/* webpackChunkName: 'plugins/omni-bar-plugin' */ '@mapstore/framework/plugins/OmniBar')
    ),
    BurgerMenuPlugin: toLazyPlugin(
        'BurgerMenu',
        () => import(/* webpackChunkName: 'plugins/burger-menu-plugin' */ '@mapstore/framework/plugins/BurgerMenu')
    ),
    GeoStoryPlugin: toLazyPlugin(
        'GeoStory',
        () => import(/* webpackChunkName: 'plugins/geostory-plugin' */ '@mapstore/framework/plugins/GeoStory')
    ),
    MapPlugin: toLazyPlugin(
        'Map',
        () => import(/* webpackChunkName: 'plugins/map-plugin' */ '@mapstore/framework/plugins/Map')
    ),
    MediaEditorPlugin: toLazyPlugin(
        'MediaEditor',
        () => import(/* webpackChunkName: 'plugins/media-editor-plugin' */ '@mapstore/framework/plugins/MediaEditor')
    ),
    GeoStoryEditorPlugin: toLazyPlugin(
        'GeoStoryEditor',
        () => import(/* webpackChunkName: 'plugins/geostory-editor-plugin' */ '@mapstore/framework/plugins/GeoStoryEditor')
    ),
    GeoStoryNavigationPlugin: toLazyPlugin(
        'GeoStoryNavigation',
        () => import(/* webpackChunkName: 'plugins/geostory-navigation-plugin' */ '@mapstore/framework/plugins/GeoStoryNavigation')
    ),
    NotificationsPlugin: toLazyPlugin(
        'Notifications',
        () => import(/* webpackChunkName: 'plugins/notifications-plugin' */ '@mapstore/framework/plugins/Notifications')
    ),
    SavePlugin: toLazyPlugin(
        'Save',
        () => import(/* webpackChunkName: 'plugins/save-plugin' */ '@js/plugins/Save')
    ),
    SaveAsPlugin: toLazyPlugin(
        'SaveAs',
        () => import(/* webpackChunkName: 'plugins/save-as-plugin' */ '@js/plugins/SaveAs')
    ),
    SearchPlugin: toLazyPlugin(
        'Search',
        () => import(/* webpackChunkName: 'plugins/search-plugin' */ '@mapstore/framework/plugins/Search')
    ),
    SharePlugin: toLazyPlugin(
        'Share',
        () => import(/* webpackChunkName: 'plugins/share-plugin' */ '@js/plugins/Share')
    ),
    IdentifyPlugin: toLazyPlugin(
        'Identify',
        () => import(/* webpackChunkName: 'plugins/identify-plugin' */ '@mapstore/framework/plugins/Identify')
    ),
    ToolbarPlugin: toLazyPlugin(
        'Toolbar',
        () => import(/* webpackChunkName: 'plugins/toolbar-plugin' */ '@mapstore/framework/plugins/Toolbar')
    ),
    ZoomAllPlugin: toLazyPlugin(
        'ZoomAll',
        () => import(/* webpackChunkName: 'plugins/zoom-all-plugin' */ '@mapstore/framework/plugins/ZoomAll')
    ),
    MapLoadingPlugin: toLazyPlugin(
        'MapLoading',
        () => import(/* webpackChunkName: 'plugins/map-loading-plugin' */ '@mapstore/framework/plugins/MapLoading')
    ),
    BackgroundSelectorPlugin: toLazyPlugin(
        'BackgroundSelector',
        () => import(/* webpackChunkName: 'plugins/background-selector-plugin' */ '@mapstore/framework/plugins/BackgroundSelector')
    ),
    ZoomInPlugin: toLazyPlugin(
        'ZoomIn',
        () => import(/* webpackChunkName: 'plugins/zoom-in-plugin' */ '@mapstore/framework/plugins/ZoomIn')
    ),
    ZoomOutPlugin: toLazyPlugin(
        'ZoomOut',
        () => import(/* webpackChunkName: 'plugins/zoom-out-plugin' */ '@mapstore/framework/plugins/ZoomOut')
    ),
    ExpanderPlugin: toLazyPlugin(
        'Expander',
        () => import(/* webpackChunkName: 'plugins/expander-plugin' */ '@mapstore/framework/plugins/Expander')
    ),
    ScaleBoxPlugin: toLazyPlugin(
        'ScaleBox',
        () => import(/* webpackChunkName: 'plugins/scale-box-plugin' */ '@mapstore/framework/plugins/ScaleBox')
    ),
    MapFooterPlugin: toLazyPlugin(
        'MapFooter',
        () => import(/* webpackChunkName: 'plugins/map-footer-plugin' */ '@mapstore/framework/plugins/MapFooter')
    ),
    PrintPlugin: toLazyPlugin(
        'Print',
        () => import(/* webpackChunkName: 'plugins/print-plugin' */ '@mapstore/framework/plugins/Print'),
        {
            containers: {
                ActionNavbar: {
                    name: 'Print',
                    Component: PrintActionButton,
                    priority: 5,
                    doNotHide: true
                }
            }
        }
    ),
    TimelinePlugin: toLazyPlugin(
        'Timeline',
        () => import(/* webpackChunkName: 'plugins/timeline-plugin' */ '@mapstore/framework/plugins/Timeline')
    ),
    PlaybackPlugin: toLazyPlugin(
        'Playback',
        () => import(/* webpackChunkName: 'plugins/playback-plugin' */ '@mapstore/framework/plugins/Playback')
    ),
    LocatePlugin: toLazyPlugin(
        'Locate',
        () => import(/* webpackChunkName: 'plugins/locate-plugin' */ '@mapstore/framework/plugins/Locate')
    ),
    TOCPlugin: toLazyPlugin(
        'TOC',
        () => import(/* webpackChunkName: 'plugins/toc-plugin' */ '@mapstore/framework/plugins/TOC')
    ),
    DrawerMenuPlugin: toLazyPlugin(
        'DrawerMenu',
        () => import(/* webpackChunkName: 'plugins/drawer-menu-plugin' */ '@mapstore/framework/plugins/DrawerMenu')
    ),
    ActionNavbarPlugin: toLazyPlugin(
        'ActionNavbar',
        () => import(/* webpackChunkName: 'plugins/action-navbar-plugin' */ '@js/plugins/ActionNavbar')
    ),
    DetailViewerPlugin: toLazyPlugin(
        'DetailViewer',
        () => import(/* webpackChunkName: 'plugins/detail-viewer-plugin' */ '@js/plugins/DetailViewer')
    ),
    MediaViewerPlugin: toLazyPlugin(
        'MediaViewer',
        () => import(/* webpackChunkName: 'plugins/media-viewer-plugin' */ '@js/plugins/MediaViewer')
    ),
    FitBoundsPlugin: toLazyPlugin(
        'FitBounds',
        () => import(/* webpackChunkName: 'plugins/fit-bounds-plugin' */ '@js/plugins/FitBounds')
    ),
    DashboardEditorPlugin: toLazyPlugin(
        'DashboardEditor',
        () => import(/* webpackChunkName: 'plugins/dashboard-editor-plugin' */ '@mapstore/framework/plugins/DashboardEditor')
    ),
    DashboardPlugin: toLazyPlugin(
        'Dashboard',
        () => import(/* webpackChunkName: 'plugins/dashboard-plugin' */ '@mapstore/framework/plugins/Dashboard')
    ),
    AnnotationsPlugin: toLazyPlugin(
        'Annotations',
        () => import(/* webpackChunkName: 'plugins/annotations-plugin' */ '@mapstore/framework/plugins/Annotations'),
        {
            containers: {
                ActionNavbar: {
                    name: 'Annotations',
                    Component: AnnotationsActionButton,
                    priority: 2,
                    doNotHide: true
                }
            }
        }
    ),
    DeleteResourcePlugin: toLazyPlugin(
        'DeleteResource',
        () => import(/* webpackChunkName: 'plugins/delete-resource-plugin' */ '@js/plugins/DeleteResource')
    ),
    DownloadResourcePlugin: toLazyPlugin(
        'DownloadResource',
        () => import(/* webpackChunkName: 'plugins/download-resource-plugin' */ '@js/plugins/DownloadResource')
    ),
    VisualStyleEditorPlugin: toLazyPlugin(
        'VisualStyleEditor',
        () => import(/* webpackChunkName: 'plugins/visual-style-editor-plugin' */ '@js/plugins/VisualStyleEditor')
    ),
    LegendPlugin: toLazyPlugin(
        'Legend',
        () => import(/* webpackChunkName: 'plugins/legend-plugin' */ '@js/plugins/Legend')
    ),
    DatasetsCatalogPlugin: toLazyPlugin(
        'DatasetsCatalog',
        () => import(/* webpackChunkName: 'plugins/dataset-catalog' */ '@js/plugins/DatasetsCatalog')
    ),
    LayerSettingsPlugin: toLazyPlugin(
        'LayerSettings',
        () => import(/* webpackChunkName: 'plugins/layer-settings' */ '@js/plugins/LayerSettings')
    ),
    SyncPlugin: toLazyPlugin(
        'Sync',
        () => import(/* webpackChunkName: 'plugins/sync-plugin' */ '@js/plugins/Sync')
    )
};

const pluginsDefinition = {
    plugins,
    requires: {
        getMetadataUrl,
        getMetadataDetailUrl,
        resourceHasPermission,
        canCopyResource
    },
    epics: {},
    reducers: {}
};

export default splitLazyAndStaticPlugins(pluginsDefinition);
