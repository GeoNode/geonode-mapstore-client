/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import main from '@mapstore/framework/components/app/main';
import MainLoader from '@js/components/MainLoader';
import ViewerRoute from '@js/routes/Viewer';
import Router, { withRoutes } from '@js/components/Router';
import security from '@mapstore/framework/reducers/security';
import maptype from '@mapstore/framework/reducers/maptype';
import geostory from '@mapstore/framework/reducers/geostory';
import gnresource from '@js/reducers/gnresource';
import gnsettings from '@js/reducers/gnsettings';
import { registerMediaAPI } from '@mapstore/framework/api/media';
import * as geoNodeMediaApi from '@js/observables/media/geonode';
import {
    getEndpoints,
    getConfiguration, getAccountInfo
} from '@js/api/geonode/v2';
import { updateGeoNodeSettings } from '@js/actions/gnsettings';
import { requestResourceConfig } from '@js/actions/gnresource';
import gnresourceEpics from '@js/epics/gnresource';
import {
    setupConfiguration,
    initializeApp,
    getPluginsConfiguration,
    getPluginsConfigOverride
} from '@js/utils/AppUtils';
import { ResourceTypes } from '@js/utils/ResourceUtils';
import pluginsDefinition, { storeEpicsNamesToExclude, cleanEpics } from '@js/plugins/index';
import ReactSwipe from 'react-swipeable-views';
import SwipeHeader from '@mapstore/framework/components/data/identify/SwipeHeader';
const requires = {
    ReactSwipe,
    SwipeHeader
};
import { GEOSTORY_ROUTES, appRouteComponentTypes } from '@js/utils/AppRoutesUtils';

registerMediaAPI('geonode', geoNodeMediaApi);

// TODO: check styles on less files
import 'react-select/dist/react-select.css';

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE,
    user: state?.security?.user || null
}))(Router);

const viewer = {
    [appRouteComponentTypes.VIEWER]: ViewerRoute
};

const routes = GEOSTORY_ROUTES.map(({component, ...config}) => ({...config, component: viewer[component]}));

initializeApp();

document.addEventListener('DOMContentLoaded', function() {
    getEndpoints()
        .then(()=>Promise.all([
            getConfiguration(),
            getAccountInfo()
        ])
            .then(([localConfig, user]) => {
                setupConfiguration({ localConfig, user })
                    .then(({
                        securityState,
                        geoNodeConfiguration,
                        pluginsConfigKey,
                        geoNodePageConfig,
                        configEpics,
                        onStoreInit,
                        targetId = 'ms-container',
                        settings
                    }) => {

                        const appEpics = cleanEpics({
                            ...configEpics,
                            ...gnresourceEpics
                        });

                        storeEpicsNamesToExclude(appEpics);

                        main({
                            targetId,
                            appComponent: withRoutes(routes)(ConnectedRouter),
                            pluginsConfig: getPluginsConfigOverride(getPluginsConfiguration(localConfig.plugins, pluginsConfigKey)),
                            loaderComponent: MainLoader,
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
                            themeCfg: null,
                            appReducers: {
                                geostory,
                                gnresource,
                                gnsettings,
                                security,
                                maptype
                            },
                            appEpics,
                            onStoreInit,
                            geoNodeConfiguration,
                            initialActions: [
                            // add some settings in the global state to make them accessible in the monitor state
                            // later we could use expression in localConfig
                                updateGeoNodeSettings.bind(null, settings),
                                ...(geoNodePageConfig.resourceId !== undefined
                                    ? [ requestResourceConfig.bind(null, ResourceTypes.GEOSTORY, geoNodePageConfig.resourceId) ]
                                    : [])
                            ]
                        });
                    });

            })
        );
});
