/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import omit from 'lodash/omit';
import uniq from 'lodash/uniq';
import {
    PrintActionButton,
    CatalogActionButton,
    MeasureActionButton,
    LayerDownloadActionButton,
    AnnotationsActionButton,
    FullScreenActionButton,
    FilterLayerActionButton
} from '@js/plugins/actionnavbar/buttons';
import { getPluginsContext } from '@js/utils/PluginsContextUtils';
import { toModulePlugin as msToModulePlugin } from '@mapstore/framework/utils/ModulePluginsUtils';

let epicsNamesToExclude = [
    'loadGeostoryEpic',
    'reloadGeoStoryOnLoginLogout',
    'loadStoryOnHistoryPop',
    'saveGeoStoryResource'
];

// we need to exclude epics that have been initialized already at app level
export const storeEpicsNamesToExclude = (epics) => {
    Object.keys(epics).forEach((key) => {
        epicsNamesToExclude.push(key);
    });
    epicsNamesToExclude = uniq(epicsNamesToExclude);
};

function cleanEpics(epics, excludedNames = []) {
    const containsExcludedEpic = !!excludedNames.find((epicName) => epics[epicName]);
    if (containsExcludedEpic) {
        return omit(epics, excludedNames);
    }
    return epics;
}

// workaround to exclude epics we do not need in geonode
const toModulePlugin = (...args) => {
    const getModulePlugin = () => msToModulePlugin(...args)()
        .then((mod) => {
            if (!mod?.default?.epics) {
                return mod;
            }
            return {
                ...mod,
                'default': {
                    ...mod.default,
                    epics: cleanEpics(mod.default.epics, epicsNamesToExclude)
                }
            };
        });
    getModulePlugin.isModulePlugin = true;
    return getModulePlugin;
};

export const plugins = {
    LayerDownloadPlugin: toModulePlugin(
        'LayerDownload',
        () => import(/* webpackChunkName: 'plugins/layer-download' */ '@mapstore/framework/plugins/LayerDownload'),
        {
            overrides: {
                containers: {
                    ActionNavbar: {
                        name: 'LayerDownload',
                        Component: LayerDownloadActionButton
                    }
                }
            }
        }
    ),
    SwipePlugin: toModulePlugin(
        'Swipe',
        () => import(/* webpackChunkName: 'plugins/swipe' */ '@mapstore/framework/plugins/Swipe')
    ),
    SearchServicesConfigPlugin: toModulePlugin(
        'SearchServicesConfig',
        () => import(/* webpackChunkName: 'plugins/search-service-config' */ '@mapstore/framework/plugins/SearchServicesConfig')
    ),
    MousePositionPlugin: toModulePlugin(
        'MousePosition',
        () => import(/* webpackChunkName: 'plugins/mouse-position' */ '@mapstore/framework/plugins/MousePosition')
    ),
    StyleEditorPlugin: toModulePlugin(
        'StyleEditor',
        () => import(/* webpackChunkName: 'plugins/style-editor' */ '@mapstore/framework/plugins/StyleEditor')
    ),
    MetadataExplorerPlugin: toModulePlugin(
        'MetadataExplorer',
        () => import(/* webpackChunkName: 'plugins/metadata-explorer' */ '@mapstore/framework/plugins/MetadataExplorer'),
        {
            overrides: {
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
        }
    ),
    QueryPanelPlugin: toModulePlugin(
        'QueryPanel',
        () => import(/* webpackChunkName: 'plugins/query-panel' */ '@mapstore/framework/plugins/QueryPanel')
    ),
    FeatureEditorPlugin: toModulePlugin(
        'FeatureEditor',
        () => import(/* webpackChunkName: 'plugins/feature-editor-plugin' */ '@mapstore/framework/plugins/FeatureEditor')
    ),
    WidgetsTrayPlugin: toModulePlugin(
        'WidgetsTray',
        () => import(/* webpackChunkName: 'plugins/widgets-tray-plugin' */ '@mapstore/framework/plugins/WidgetsTray')
    ),
    WidgetsBuilderPlugin: toModulePlugin(
        'WidgetsBuilder',
        () => import(/* webpackChunkName: 'plugins/widgets-builder-plugin' */ '@mapstore/framework/plugins/WidgetsBuilder')
    ),
    WidgetsPlugin: toModulePlugin(
        'Widgets',
        () => import(/* webpackChunkName: 'plugins/widgets-plugin' */ '@mapstore/framework/plugins/Widgets')
    ),
    TOCItemsSettingsPlugin: toModulePlugin(
        'TOCItemsSettings',
        () => import(/* webpackChunkName: 'plugins/toc-items-settings-plugin' */ '@mapstore/framework/plugins/TOCItemsSettings')
    ),
    FilterLayerPlugin: toModulePlugin(
        'FilterLayer',
        () => import(/* webpackChunkName: 'plugins/filter-layer-plugin' */ '@mapstore/framework/plugins/FilterLayer'),
        {
            overrides: {
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
        }
    ),
    MeasurePlugin: toModulePlugin(
        'Measure',
        () => import(/* webpackChunkName: 'plugins/measure-plugin' */ '@mapstore/framework/plugins/Measure'),
        {
            overrides: {
                containers: {
                    ActionNavbar: {
                        name: 'Measure',
                        Component: MeasureActionButton
                    }
                }
            }
        }
    ),
    FullScreenPlugin: toModulePlugin(
        'FullScreen',
        () => import(/* webpackChunkName: 'plugins/fullscreen-plugin' */ '@mapstore/framework/plugins/FullScreen'),
        {
            overrides: {
                containers: {
                    ActionNavbar: {
                        name: 'FullScreen',
                        Component: FullScreenActionButton,
                        priority: 5
                    }
                }
            }
        }
    ),
    AddGroupPlugin: toModulePlugin(
        'AddGroup',
        () => import(/* webpackChunkName: 'plugins/add-group-plugin' */ '@mapstore/framework/plugins/AddGroup')
    ),
    OmniBarPlugin: toModulePlugin(
        'OmniBar',
        () => import(/* webpackChunkName: 'plugins/omni-bar-plugin' */ '@mapstore/framework/plugins/OmniBar')
    ),
    BurgerMenuPlugin: toModulePlugin(
        'BurgerMenu',
        () => import(/* webpackChunkName: 'plugins/burger-menu-plugin' */ '@mapstore/framework/plugins/BurgerMenu')
    ),
    GeoStoryPlugin: toModulePlugin(
        'GeoStory',
        () => import(/* webpackChunkName: 'plugins/geostory-plugin' */ '@mapstore/framework/plugins/GeoStory')
    ),
    MapPlugin: toModulePlugin(
        'Map',
        () => import(/* webpackChunkName: 'plugins/map-plugin' */ '@mapstore/framework/plugins/Map')
    ),
    MediaEditorPlugin: toModulePlugin(
        'MediaEditor',
        () => import(/* webpackChunkName: 'plugins/media-editor-plugin' */ '@mapstore/framework/plugins/MediaEditor')
    ),
    GeoStoryEditorPlugin: toModulePlugin(
        'GeoStoryEditor',
        () => import(/* webpackChunkName: 'plugins/geostory-editor-plugin' */ '@mapstore/framework/plugins/GeoStoryEditor')
    ),
    GeoStoryNavigationPlugin: toModulePlugin(
        'GeoStoryNavigation',
        () => import(/* webpackChunkName: 'plugins/geostory-navigation-plugin' */ '@mapstore/framework/plugins/GeoStoryNavigation')
    ),
    NotificationsPlugin: toModulePlugin(
        'Notifications',
        () => import(/* webpackChunkName: 'plugins/notifications-plugin' */ '@mapstore/framework/plugins/Notifications')
    ),
    SavePlugin: toModulePlugin(
        'Save',
        () => import(/* webpackChunkName: 'plugins/save-plugin' */ '@js/plugins/Save')
    ),
    SaveAsPlugin: toModulePlugin(
        'SaveAs',
        () => import(/* webpackChunkName: 'plugins/save-as-plugin' */ '@js/plugins/SaveAs')
    ),
    SearchPlugin: toModulePlugin(
        'Search',
        () => import(/* webpackChunkName: 'plugins/search-plugin' */ '@mapstore/framework/plugins/Search')
    ),
    SharePlugin: toModulePlugin(
        'Share',
        () => import(/* webpackChunkName: 'plugins/share-plugin' */ '@js/plugins/Share')
    ),
    IdentifyPlugin: toModulePlugin(
        'Identify',
        () => import(/* webpackChunkName: 'plugins/identify-plugin' */ '@mapstore/framework/plugins/Identify')
    ),
    ToolbarPlugin: toModulePlugin(
        'Toolbar',
        () => import(/* webpackChunkName: 'plugins/toolbar-plugin' */ '@mapstore/framework/plugins/Toolbar')
    ),
    ZoomAllPlugin: toModulePlugin(
        'ZoomAll',
        () => import(/* webpackChunkName: 'plugins/zoom-all-plugin' */ '@mapstore/framework/plugins/ZoomAll')
    ),
    MapLoadingPlugin: toModulePlugin(
        'MapLoading',
        () => import(/* webpackChunkName: 'plugins/map-loading-plugin' */ '@mapstore/framework/plugins/MapLoading')
    ),
    BackgroundSelectorPlugin: toModulePlugin(
        'BackgroundSelector',
        () => import(/* webpackChunkName: 'plugins/background-selector-plugin' */ '@mapstore/framework/plugins/BackgroundSelector')
    ),
    ZoomInPlugin: toModulePlugin(
        'ZoomIn',
        () => import(/* webpackChunkName: 'plugins/zoom-in-plugin' */ '@mapstore/framework/plugins/ZoomIn')
    ),
    ZoomOutPlugin: toModulePlugin(
        'ZoomOut',
        () => import(/* webpackChunkName: 'plugins/zoom-out-plugin' */ '@mapstore/framework/plugins/ZoomOut')
    ),
    ExpanderPlugin: toModulePlugin(
        'Expander',
        () => import(/* webpackChunkName: 'plugins/expander-plugin' */ '@mapstore/framework/plugins/Expander')
    ),
    ScaleBoxPlugin: toModulePlugin(
        'ScaleBox',
        () => import(/* webpackChunkName: 'plugins/scale-box-plugin' */ '@mapstore/framework/plugins/ScaleBox')
    ),
    MapFooterPlugin: toModulePlugin(
        'MapFooter',
        () => import(/* webpackChunkName: 'plugins/map-footer-plugin' */ '@mapstore/framework/plugins/MapFooter')
    ),
    PrintPlugin: toModulePlugin(
        'Print',
        () => import(/* webpackChunkName: 'plugins/print-plugin' */ '@mapstore/framework/plugins/Print'),
        {
            overrides: {
                containers: {
                    ActionNavbar: {
                        name: 'Print',
                        Component: PrintActionButton,
                        priority: 5,
                        doNotHide: true
                    }
                }
            }
        }
    ),
    PrintTextInputPlugin: toModulePlugin(
        'PrintTextInput',
        () => import(/* webpackChunkName: 'plugins/print-text-input-plugin' */ '@mapstore/framework/plugins/print/TextInput')
    ),
    PrintOutputFormatPlugin: toModulePlugin(
        'PrintOutputFormat',
        () => import(/* webpackChunkName: 'plugins/print-output-format-plugin' */ '@mapstore/framework/plugins/print/OutputFormat')
    ),
    PrintScalePlugin: toModulePlugin(
        'PrintScale',
        () => import(/* webpackChunkName: 'plugins/print-scale-plugin' */ '@mapstore/framework/plugins/print/Scale')
    ),
    PrintProjectionPlugin: toModulePlugin(
        'PrintProjection',
        () => import(/* webpackChunkName: 'plugins/print-projection-plugin' */ '@mapstore/framework/plugins/print/Projection')
    ),
    PrintGraticulePlugin: toModulePlugin(
        'PrintGraticule',
        () => import(/* webpackChunkName: 'plugins/print-graticule-plugin' */ '@mapstore/framework/plugins/print/Graticule')
    ),
    TimelinePlugin: toModulePlugin(
        'Timeline',
        () => import(/* webpackChunkName: 'plugins/timeline-plugin' */ '@mapstore/framework/plugins/Timeline')
    ),
    PlaybackPlugin: toModulePlugin(
        'Playback',
        () => import(/* webpackChunkName: 'plugins/playback-plugin' */ '@mapstore/framework/plugins/Playback')
    ),
    LocatePlugin: toModulePlugin(
        'Locate',
        () => import(/* webpackChunkName: 'plugins/locate-plugin' */ '@mapstore/framework/plugins/Locate')
    ),
    TOCPlugin: toModulePlugin(
        'TOC',
        () => import(/* webpackChunkName: 'plugins/toc-plugin' */ '@mapstore/framework/plugins/TOC')
    ),
    DrawerMenuPlugin: toModulePlugin(
        'DrawerMenu',
        () => import(/* webpackChunkName: 'plugins/drawer-menu-plugin' */ '@mapstore/framework/plugins/DrawerMenu')
    ),
    ActionNavbarPlugin: toModulePlugin(
        'ActionNavbar',
        () => import(/* webpackChunkName: 'plugins/action-navbar-plugin' */ '@js/plugins/ActionNavbar')
    ),
    DetailViewerPlugin: toModulePlugin(
        'DetailViewer',
        () => import(/* webpackChunkName: 'plugins/detail-viewer-plugin' */ '@js/plugins/DetailViewer')
    ),
    MediaViewerPlugin: toModulePlugin(
        'MediaViewer',
        () => import(/* webpackChunkName: 'plugins/media-viewer-plugin' */ '@js/plugins/MediaViewer')
    ),
    FitBoundsPlugin: toModulePlugin(
        'FitBounds',
        () => import(/* webpackChunkName: 'plugins/fit-bounds-plugin' */ '@js/plugins/FitBounds')
    ),
    DashboardEditorPlugin: toModulePlugin(
        'DashboardEditor',
        () => import(/* webpackChunkName: 'plugins/dashboard-editor-plugin' */ '@mapstore/framework/plugins/DashboardEditor')
    ),
    DashboardPlugin: toModulePlugin(
        'Dashboard',
        () => import(/* webpackChunkName: 'plugins/dashboard-plugin' */ '@mapstore/framework/plugins/Dashboard')
    ),
    AnnotationsPlugin: toModulePlugin(
        'Annotations',
        () => import(/* webpackChunkName: 'plugins/annotations-plugin' */ '@mapstore/framework/plugins/Annotations'),
        {
            overrides: {
                containers: {
                    ActionNavbar: {
                        name: 'Annotations',
                        Component: AnnotationsActionButton,
                        priority: 3,
                        doNotHide: true
                    }
                }
            }
        }
    ),
    DeleteResourcePlugin: toModulePlugin(
        'DeleteResource',
        () => import(/* webpackChunkName: 'plugins/delete-resource-plugin' */ '@js/plugins/DeleteResource')
    ),
    DownloadResourcePlugin: toModulePlugin(
        'DownloadResource',
        () => import(/* webpackChunkName: 'plugins/download-resource-plugin' */ '@js/plugins/DownloadResource')
    ),
    VisualStyleEditorPlugin: toModulePlugin(
        'VisualStyleEditor',
        () => import(/* webpackChunkName: 'plugins/visual-style-editor-plugin' */ '@js/plugins/VisualStyleEditor')
    ),
    LegendPlugin: toModulePlugin(
        'Legend',
        () => import(/* webpackChunkName: 'plugins/legend-plugin' */ '@js/plugins/Legend')
    ),
    DatasetsCatalogPlugin: toModulePlugin(
        'DatasetsCatalog',
        () => import(/* webpackChunkName: 'plugins/dataset-catalog' */ '@js/plugins/DatasetsCatalog')
    ),
    LayerSettingsPlugin: toModulePlugin(
        'LayerSettings',
        () => import(/* webpackChunkName: 'plugins/layer-settings' */ '@js/plugins/LayerSettings')
    ),
    SyncPlugin: toModulePlugin(
        'Sync',
        () => import(/* webpackChunkName: 'plugins/sync-plugin' */ '@js/plugins/Sync')
    ),
    IsoDownloadPlugin: toModulePlugin(
        'IsoDownload',
        () => import(/* webpackChunkName: 'plugins/iso-download-plugin' */ '@js/plugins/downloads/IsoDownload')
    ),
    DublinCoreDownloadPlugin: toModulePlugin(
        'DublinCoreDownload',
        () => import(/* webpackChunkName: 'plugins/iso-download-plugin' */ '@js/plugins/downloads/DublinCoreDownload')
    ),
    ResourcesGridPlugin: toModulePlugin(
        'ResourcesGrid',
        () => import(/* webpackChunkName: 'plugins/resources-grid' */ '@js/plugins/ResourcesGrid')
    ),
    FeaturedResourcesGridPlugin: toModulePlugin(
        'FeaturedResourcesGrid',
        () => import(/* webpackChunkName: 'plugins/featured-resources-grid' */ '@js/plugins/FeaturedResourcesGrid')
    )
};

const pluginsDefinition = {
    plugins,
    requires: getPluginsContext(),
    epics: {},
    reducers: {}
};

export default pluginsDefinition;
