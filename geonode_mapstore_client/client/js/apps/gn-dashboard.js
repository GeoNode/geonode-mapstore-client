/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import main from '@mapstore/framework/components/app/main';
import MainLoader from '@js/components/app/MainLoader';
import DashboardRoute from '@js/routes/Dashboard';
import Router, { withRoutes } from '@js/components/app/Router';
import security from '@mapstore/framework/reducers/security';
import maptype from '@mapstore/framework/reducers/maptype';
import dashboard from '@mapstore/framework/reducers/dashboard';
import widgets from '@mapstore/framework/reducers/widgets';
import gnresource from '@js/reducers/gnresource';
import gnsettings from '@js/reducers/gnsettings';
import { updateGeoNodeSettings } from '@js/actions/gnsettings';
import {
    getEndpoints,
    getConfiguration,
    getAccountInfo
} from '@js/api/geonode/v2';
import {
    setupConfiguration,
    getVersion,
    initializeApp,
    getPluginsConfiguration
} from '@js/utils/AppUtils';
import pluginsDefinition from '@js/plugins/index';
import ReactSwipe from 'react-swipeable-views';
import SwipeHeader from '@mapstore/framework/components/data/identify/SwipeHeader';

const requires = {
    ReactSwipe,
    SwipeHeader
};

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE
}))(Router);

const routes = [{
    name: 'dashboard_embed',
    path: [
        '/'
    ],
    component: DashboardRoute
}];

import '@js/observables/persistence';

initializeApp();

document.addEventListener('DOMContentLoaded', function() {
    getEndpoints().then(() => {
        Promise.all([
            getConfiguration(),
            getAccountInfo()
        ])
            .then(([localConfig, user]) => {

                const {
                    securityState,
                    geoNodeConfiguration,
                    pluginsConfigKey,
                    configEpics,
                    onStoreInit,
                    targetId = 'ms-container',
                    settings,
                    query
                } = setupConfiguration({ localConfig, user });

                main({
                    targetId,
                    appComponent: withRoutes(routes)(ConnectedRouter),
                    pluginsConfig: getPluginsConfiguration(localConfig.plugins, pluginsConfigKey),
                    loaderComponent: MainLoader,
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
                    initialState: {
                        defaultState: {
                            maptype: {
                                mapType: 'openlayers'
                            },
                            ...securityState
                        }
                    },
                    themeCfg: {
                        path: '/static/mapstore/dist/themes',
                        prefixContainer: '#' + targetId,
                        version: getVersion(),
                        prefix: 'msgapi',
                        theme: query.theme
                    },
                    appReducers: {
                        dashboard,
                        gnresource,
                        gnsettings,
                        security,
                        maptype,
                        widgets
                    },
                    appEpics: {
                        ...configEpics
                    },
                    onStoreInit,
                    geoNodeConfiguration,
                    initialActions: [
                        // add some settings in the global state to make them accessible in the monitor state
                        // later we could use expression in localConfig
                        updateGeoNodeSettings.bind(null, settings)
                    ]
                });
            });
    });

});
