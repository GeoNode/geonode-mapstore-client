/*
 * Copyright 2020, GeoSolutions Sas.
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
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { changeMapInfoFormat } from '@mapstore/framework/actions/mapInfo';
import StandardApp from '@mapstore/framework/components/app/StandardApp';
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
import context from '@mapstore/framework/reducers/context';
// end

import ViewerRoute from '@js/routes/Viewer';
import MapViewerRoute from '@js/routes/MapViewer';

import gnresource from '@js/reducers/gnresource';
import gnsettings from '@js/reducers/gnsettings';

import { getConfiguration, getAccountInfo, getEndpoints } from '@js/api/geonode/v2';

import {
    setupConfiguration,
    initializeApp,
    getPluginsConfiguration,
    getPluginsConfigOverride
} from '@js/utils/AppUtils';
import { ResourceTypes } from '@js/utils/ResourceUtils';
import { requestResourceConfig } from '@js/actions/gnresource';
import { updateGeoNodeSettings } from '@js/actions/gnsettings';

import {
    updateMapLayoutEpic,
    gnCheckSelectedDatasetPermissions,
    gnSetDatasetsPermissions
} from '@js/epics';

import timelineEpics from '@mapstore/framework/epics/timeline';
import gnresourceEpics from '@js/epics/gnresource';
import maplayout from '@mapstore/framework/reducers/maplayout';
import 'react-widgets/dist/css/react-widgets.css';
import 'react-select/dist/react-select.css';

import pluginsDefinition, { storeEpicsNamesToExclude, cleanEpics } from '@js/plugins/index';
import ReactSwipe from 'react-swipeable-views';
import SwipeHeader from '@mapstore/framework/components/data/identify/SwipeHeader';
const requires = {
    ReactSwipe,
    SwipeHeader
};
import { MAP_ROUTES, appRouteComponentTypes } from '@js/utils/AppRoutesUtils';

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE,
    user: state?.security?.user || null
}))(Router);

const viewer = {
    [appRouteComponentTypes.VIEWER]: ViewerRoute,
    [appRouteComponentTypes.MAP_VIEWER]: MapViewerRoute
};

const routes = MAP_ROUTES.map(({component, ...config}) => ({...config, component: viewer[component]}));

initializeApp();

document.addEventListener('DOMContentLoaded', function() {
    getEndpoints()
        .then(()=>Promise.all([
            getConfiguration(),
            getAccountInfo()
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
                        geoNodePageConfig,
                        query,
                        configEpics,
                        onStoreInit,
                        targetId = 'ms-container',
                        settings
                    }) => {
                    // get the correct map layout
                        const mapLayout = getConfigProp('mapLayout') || {};
                        setConfigProp('mapLayout', mapLayout[query.theme] || mapLayout.viewer);

                        const resourceId = geoNodePageConfig.resourceId;
                        const resourceSubtype = geoNodePageConfig.resourceSubtype;

                        const appEpics = cleanEpics({
                            ...standardEpics,
                            ...configEpics,
                            updateMapLayoutEpic,
                            gnCheckSelectedDatasetPermissions,
                            gnSetDatasetsPermissions,
                            ...gnresourceEpics,
                            ...pluginsDefinition.epics,
                            // needed to initialize the correct time range
                            ...timelineEpics
                        });

                        storeEpicsNamesToExclude(appEpics);

                        main({
                            targetId,
                            enableExtensions: true,
                            appComponent: withRoutes(routes)(ConnectedRouter),
                            loaderComponent: MainLoader,
                            initialState: {
                                defaultState: {
                                    ...securityState
                                }
                            },
                            themeCfg: null,
                            pluginsConfig: getPluginsConfigOverride(getPluginsConfiguration(localConfig.plugins, pluginsConfigKey)),
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
                                context,
                                ...pluginsDefinition.reducers
                            },
                            appEpics,
                            geoNodeConfiguration,
                            initialActions: [
                            // add some settings in the global state to make them accessible in the monitor state
                            // later we could use expression in localConfig
                                updateGeoNodeSettings.bind(null, settings),
                                loadPrintCapabilities.bind(null, getConfigProp('printUrl')),
                                setControlProperty.bind(null, 'toolbar', 'expanded', false),
                                ...(resourceId !== undefined
                                    ? [ requestResourceConfig.bind(null, geoNodePageConfig.resourceType || ResourceTypes.MAP, resourceId, {
                                        params: {
                                            subtype: resourceSubtype
                                        }
                                    }) ]
                                    : []),
                                changeMapInfoFormat.bind(null, 'application/json')
                            ]
                        },
                        withExtensions(StandardApp));
                    });

            })
        );
});
