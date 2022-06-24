/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { connect } from 'react-redux';
import main from '@mapstore/framework/components/app/main';
import ViewerRoute from '@js/routes/Viewer';
import MainLoader from '@js/components/MainLoader';
import Router, { withRoutes } from '@js/components/Router';
import security from '@mapstore/framework/reducers/security';
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
    initializeApp,
    getPluginsConfiguration,
    storeEpicsCache
} from '@js/utils/AppUtils';
import { ResourceTypes } from '@js/utils/ResourceUtils';
import pluginsDefinition from '@js/plugins/index';
import ReactSwipe from 'react-swipeable-views';
import SwipeHeader from '@mapstore/framework/components/data/identify/SwipeHeader';
import { requestResourceConfig } from '@js/actions/gnresource';
import gnresourceEpics from '@js/epics/gnresource';
const requires = {
    ReactSwipe,
    SwipeHeader
};
import '@js/observables/persistence';

initializeApp();

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE
}))(Router);


const routes = [{
    name: 'document_embed',
    path: [
        '/'
    ],
    pageConfig: {
        resourceType: ResourceTypes.DOCUMENT
    },
    component: ViewerRoute
}];

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
                        geoNodeConfiguration,
                        pluginsConfigKey,
                        configEpics,
                        onStoreInit,
                        geoNodePageConfig,
                        targetId = 'ms-container',
                        settings
                    }) => {

                        const appEpics = {
                            ...configEpics,
                            ...gnresourceEpics
                        };

                        storeEpicsCache(appEpics);

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
                                    ...securityState
                                }
                            },
                            themeCfg: null,
                            appReducers: {
                                gnresource,
                                gnsettings,
                                security
                            },
                            appEpics,
                            onStoreInit,
                            geoNodeConfiguration,
                            initialActions: [
                                // add some settings in the global state to make them accessible in the monitor state
                                // later we could use expression in localConfig
                                updateGeoNodeSettings.bind(null, settings),
                                ...(geoNodePageConfig.resourceId !== undefined
                                    ? [requestResourceConfig.bind(null, ResourceTypes.DOCUMENT, geoNodePageConfig.resourceId, {
                                        readOnly: geoNodePageConfig.isEmbed
                                    })]
                                    : [])
                            ]
                        });
                    });
            });
    });
});
