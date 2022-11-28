/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { connect } from 'react-redux';
import main from '@mapstore/framework/components/app/main';
import ComponentsRoute from '@js/routes/Components';
import MainLoader from '@js/components/MainLoader';
import Router, { withRoutes } from '@js/components/Router';
import security from '@mapstore/framework/reducers/security';
import {
    getEndpoints,
    getConfiguration,
    getAccountInfo
} from '@js/api/geonode/v2';
import {
    setupConfiguration,
    initializeApp,
    storeEpicsCache,
    getPluginsConfiguration,
    getPluginsConfigOverride
} from '@js/utils/AppUtils';
import pluginsDefinition from '@js/plugins/index';
import StandardApp from '@mapstore/framework/components/app/StandardApp';
import withExtensions from '@mapstore/framework/components/app/withExtensions';
import gnsettings from '@js/reducers/gnsettings';
import { updateGeoNodeSettings } from '@js/actions/gnsettings';
import { COMPONENTS_ROUTES, appRouteComponentTypes } from '@js/utils/AppRoutesUtils';

const requires = {};

initializeApp();

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE
}))(Router);

const viewer = {
    [appRouteComponentTypes.COMPONENTS]: ComponentsRoute
};

const routes = COMPONENTS_ROUTES.map(({ component, ...config }) => ({ ...config, component: viewer[component] }));

document.addEventListener('DOMContentLoaded', function() {
    getEndpoints().then(() => {
        Promise.all([
            getConfiguration(),
            getAccountInfo()
        ])
            .then(([localConfig, user]) => {

                setupConfiguration({ localConfig, user })
                    .then(({
                        securityState,
                        pluginsConfigKey,
                        geoNodeConfiguration,
                        configEpics,
                        onStoreInit,
                        settings
                    }) => {

                        const appEpics = {
                            ...configEpics
                        };

                        storeEpicsCache(appEpics);

                        main({
                            appComponent: withRoutes(routes)(ConnectedRouter),
                            pluginsConfig: getPluginsConfigOverride(getPluginsConfiguration(localConfig.plugins, pluginsConfigKey)),
                            targetId: 'ms-container',
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
                                    ...securityState
                                }
                            },
                            themeCfg: null,
                            appReducers: {
                                security,
                                gnsettings
                            },
                            appEpics,
                            onStoreInit,
                            geoNodeConfiguration,
                            initialActions: [
                                updateGeoNodeSettings.bind(null, settings)
                            ]
                        });
                    }, withExtensions(StandardApp));
            });
    });
});
