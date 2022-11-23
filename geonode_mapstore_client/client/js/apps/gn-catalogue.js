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
import annotations from '@mapstore/framework/reducers/annotations';
// end

import SearchRoute from '@js/routes/Search';
import DetailRoute from '@js/routes/Detail';
import ViewerRoute from '@js/routes/Viewer';
import UploadDatasetRoute from '@js/routes/UploadDataset';
import UploadDocumentRoute from '@js/routes/UploadDocument';

import gnsearch from '@js/reducers/gnsearch';
import gnresource from '@js/reducers/gnresource';
import resourceservice from '@js/reducers/resourceservice';
import gnsettings from '@js/reducers/gnsettings';
import notifications from '@mapstore/framework/reducers/notifications';

import {
    getConfiguration,
    getEndpoints,
    getAccountInfo
} from '@js/api/geonode/v2';

import {
    setupConfiguration,
    initializeApp,
    getPluginsConfiguration,
    storeEpicsCache
} from '@js/utils/AppUtils';
import { CATALOGUE_ROUTES, appRouteComponentTypes } from '@js/utils/AppRoutesUtils';
import { updateGeoNodeSettings } from '@js/actions/gnsettings';
import {
    gnCheckSelectedDatasetPermissions,
    gnSetDatasetsPermissions,
    // to make the current layout work we need this epic
    // we should improve the layout to avoid the use of side effect to manage the page structure
    updateMapLayoutEpic
} from '@js/epics';

import timelineEpics from '@mapstore/framework/epics/timeline';
import gnresourceEpics from '@js/epics/gnresource';
import resourceServiceEpics from '@js/epics/resourceservice';
import gnsearchEpics from '@js/epics/gnsearch';
import favoriteEpics from '@js/epics/favorite';
import maplayout from '@mapstore/framework/reducers/maplayout';

import pluginsDefinition from '@js/plugins/index';
import ReactSwipe from 'react-swipeable-views';
import SwipeHeader from '@mapstore/framework/components/data/identify/SwipeHeader';

import { registerMediaAPI } from '@mapstore/framework/api/media';
import * as geoNodeMediaApi from '@js/observables/media/geonode';
registerMediaAPI('geonode', geoNodeMediaApi);

import '@js/observables/persistence';

const requires = {
    ReactSwipe,
    SwipeHeader
};

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect(
    (state) => ({
        locale: state?.locale || DEFAULT_LOCALE,
        user: state?.security?.user || null
    })
)(Router);

const viewers = {
    [appRouteComponentTypes.VIEWER]: ViewerRoute,
    [appRouteComponentTypes.DETAIL]: DetailRoute,
    [appRouteComponentTypes.SEARCH]: SearchRoute,
    [appRouteComponentTypes.DATASET_UPLOAD]: UploadDatasetRoute,
    [appRouteComponentTypes.DOCUMENT_UPLOAD]: UploadDocumentRoute
};

const routes = CATALOGUE_ROUTES.map(({ component, ...config }) => ({ ...config, component: viewers[component] }));

initializeApp();

Promise.all([
    getConfiguration(),
    getAccountInfo(),
    getEndpoints()
])
    .then(([localConfig, user]) => {
        setupConfiguration({
            localConfig,
            user
        })
            .then(({
                securityState,
                geoNodeConfiguration,
                pluginsConfigKey,
                query,
                configEpics,
                mapType = 'openlayers',
                onStoreInit,
                targetId = 'ms-container',
                settings
            }) => {
                // get the correct map layout
                const mapLayout = getConfigProp('mapLayout') || {};
                setConfigProp('mapLayout', mapLayout[query.theme] || mapLayout.viewer);

                const appEpics = {
                    ...standardEpics,
                    ...configEpics,
                    gnCheckSelectedDatasetPermissions,
                    gnSetDatasetsPermissions,
                    ...pluginsDefinition.epics,
                    ...gnresourceEpics,
                    ...resourceServiceEpics,
                    ...gnsearchEpics,
                    ...favoriteEpics,
                    updateMapLayoutEpic,
                    // needed to initialize the correct time range
                    ...timelineEpics
                };

                storeEpicsCache(appEpics);

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
                                    },
                                    annotations: {
                                        config: {
                                            multiGeometry: true,
                                            validationErrors: {}
                                        },
                                        defaultTextAnnotation: 'New'
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
                                resourceservice,
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
                                annotations,
                                notifications,
                                ...pluginsDefinition.reducers
                            },
                            appEpics,
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

    });
