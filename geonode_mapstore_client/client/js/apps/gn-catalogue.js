/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import main from '@mapstore/framework/components/app/main';
import Router, { withRoutes } from '@js/components/Router';
import MainLoader from '@js/components/MainLoader';
import { connect } from 'react-redux';
import { getConfigProp, setConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { loadPrintCapabilities } from '@mapstore/framework/actions/print';
import StandardApp from '@mapstore/framework/components/app/StandardApp';
import geostory from '@mapstore/framework/reducers/geostory';
import withExtensions from '@mapstore/framework/components/app/withExtensions';

// the app needs this epics and reducers from mapstore to correctly initialize some functionalities
import controls from '@mapstore/framework/reducers/controls';
import maptype from '@mapstore/framework/reducers/maptype';
import security from '@mapstore/framework/reducers/security';
import print from '@mapstore/framework/reducers/print';
import {
    standardReducers,
    standardEpics,
    standardRootReducerFunc
} from '@mapstore/framework/stores/defaultOptions';

import timeline from '@mapstore/framework/reducers/timeline';
import dimension from '@mapstore/framework/reducers/dimension';
import playback from '@mapstore/framework/reducers/playback';
import mapPopups from '@mapstore/framework/reducers/mapPopups';
import catalog from '@mapstore/framework/reducers/catalog';
import searchconfig from '@mapstore/framework/reducers/searchconfig';
import widgets from '@mapstore/framework/reducers/widgets';
// end

import SearchRoute from '@js/routes/Search';
import DetailRoute from '@js/routes/Detail';
import LayerViewerRoute from '@js/routes/LayerViewer';
import MapViewerRoute from '@js/routes/MapViewer';
import GeoStoryViewerRoute from '@js/routes/GeoStoryViewer';
import DocumentViewerRoute from '@js/routes/DocumentViewer';

import gnsearch from '@js/reducers/gnsearch';
import gnresource from '@js/reducers/gnresource';
import gnsettings from '@js/reducers/gnsettings';

import {
    getConfiguration,
    getEndpoints,
    getAccountInfo
} from '@js/api/geonode/v2';

import {
    setupConfiguration,
    initializeApp,
    getPluginsConfiguration
} from '@js/utils/AppUtils';

import { updateGeoNodeSettings } from '@js/actions/gnsettings';

import {
    gnCheckSelectedLayerPermissions,
    gnSetLayersPermissions
} from '@js/epics';
import gnviewerEpics from '@js/epics/gnviewer';
import gnsearchEpics from '@js/epics/gnsearch';
import favoriteEpics from '@js/epics/favorite';
import maplayout from '@mapstore/framework/reducers/maplayout';

import pluginsDefinition from '@js/plugins/index';
import ReactSwipe from 'react-swipeable-views';
import SwipeHeader from '@mapstore/framework/components/data/identify/SwipeHeader';

import { registerMediaAPI } from '@mapstore/framework/api/media';
import * as geoNodeMediaApi from '@js/observables/media/geonode';
registerMediaAPI('geonode', geoNodeMediaApi);

const requires = {
    ReactSwipe,
    SwipeHeader
};

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE
}))(Router);

const routes = [
    {
        name: 'layer_viewer',
        path: [
            '/layer/:pk'
        ],
        component: LayerViewerRoute
    },
    {
        name: 'layer_edit_data_viewer',
        path: [
            '/layer/:pk/edit/data'
        ],
        component: LayerViewerRoute
    },
    {
        name: 'layer_edit_style_viewer',
        path: [
            '/layer/:pk/edit/style'
        ],
        component: LayerViewerRoute
    },
    {
        name: 'map_viewer',
        path: [
            '/map/:pk'
        ],
        component: MapViewerRoute
    },
    {
        name: 'geostory_viewer',
        path: [
            '/geostory/:pk'
        ],
        component: GeoStoryViewerRoute
    },
    {
        name: 'document_viewer',
        path: [
            '/document/:pk'
        ],
        component: DocumentViewerRoute
    },
    {
        name: 'resources',
        path: [
            '/',
            '/search/',
            '/search/filter'
        ],
        component: SearchRoute
    },
    {
        name: 'detail',
        path: [
            '/detail/:pk',
            '/detail/:ctype/:pk'
        ],
        component: DetailRoute
    }
];

initializeApp();

Promise.all([
    getConfiguration(),
    getAccountInfo(),
    getEndpoints()
])
    .then(([localConfig, user]) => {
        const {
            securityState,
            geoNodeConfiguration,
            pluginsConfigKey,
            query,
            configEpics,
            mapType = 'openlayers',
            onStoreInit,
            targetId = 'ms-container',
            settings
        } = setupConfiguration({
            localConfig,
            user
        });

        // get the correct map layout
        const mapLayout = getConfigProp('mapLayout') || {};
        setConfigProp('mapLayout', mapLayout[query.theme] || mapLayout.viewer);

        // register custom arcgis layer
        import('@js/map/' + mapType + '/plugins/ArcGisMapServer')
            .then(() => {
                main({
                    targetId,
                    enableExtensions: true,
                    appComponent: withRoutes(routes)(ConnectedRouter),
                    loaderComponent: MainLoader,
                    initialState: {
                        defaultState: {
                            ...securityState,
                            maptype: {
                                mapType
                            }
                        }
                    },
                    themeCfg: null,
                    pluginsConfig: getPluginsConfiguration(localConfig.plugins, pluginsConfigKey),
                    lazyPlugins: pluginsDefinition.lazyPlugins,
                    pluginsDef: {
                        plugins: {
                            ...pluginsDefinition.plugins
                        },
                        requires: {
                            ...requires,
                            ...pluginsDefinition.requires
                        }
                    },
                    printEnabled: true,
                    rootReducerFunc: standardRootReducerFunc,
                    onStoreInit,
                    appReducers: {
                        ...standardReducers,
                        gnresource,
                        gnsettings,
                        security,
                        maptype,
                        print,
                        maplayout,
                        controls,
                        timeline,
                        dimension,
                        playback,
                        mapPopups,
                        catalog,
                        searchconfig,
                        widgets,
                        geostory,
                        gnsearch,
                        ...pluginsDefinition.reducers
                    },
                    appEpics: {
                        ...standardEpics,
                        ...configEpics,
                        gnCheckSelectedLayerPermissions,
                        gnSetLayersPermissions,
                        ...pluginsDefinition.epics,
                        ...gnviewerEpics,
                        ...gnsearchEpics,
                        ...favoriteEpics
                    },
                    geoNodeConfiguration,
                    initialActions: [
                        // add some settings in the global state to make them accessible in the monitor state
                        // later we could use expression in localConfig
                        updateGeoNodeSettings.bind(null, settings),
                        loadPrintCapabilities.bind(null, getConfigProp('printUrl'))
                    ]
                },
                withExtensions(StandardApp));
            });
    });
