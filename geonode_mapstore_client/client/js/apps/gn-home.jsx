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

import security from '@mapstore/framework/reducers/security';
import controls from '@mapstore/framework/reducers/controls';
import Home from '@js/routes/Home';

import gnsearch from '@js/reducers/gnsearch';
import gnresource from '@js/reducers/gnresource';
import resourceservice from '@js/reducers/resourceservice';
import gnsearchEpics from '@js/epics/gnsearch';
import gnsaveEpics from '@js/epics/gnsave';
import resourceServiceEpics from '@js/epics/resourceservice';

import {
    getConfiguration,
    getEndpoints,
    getAccountInfo,
    getResourcesTotalCount
} from '@js/api/geonode/v2';

import {
    setupConfiguration,
    initializeApp,
    storeEpicsCache
} from '@js/utils/AppUtils';

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE
}))(Router);

const routes = [
    {
        name: 'homepage',
        path: '/',
        component: Home
    }
];

initializeApp();

Promise.all([
    getConfiguration(),
    getAccountInfo(),
    getResourcesTotalCount(),
    getEndpoints()
])
    .then(([localConfig, user, resourcesTotalCount]) => {
        setupConfiguration({
            localConfig,
            user,
            resourcesTotalCount
        })
            .then(({
                securityState,
                geoNodeConfiguration
            }) => {
                const appEpics = {
                    ...gnsearchEpics,
                    ...gnsaveEpics,
                    ...resourceServiceEpics
                };

                storeEpicsCache(appEpics);
                // home app entry point
                main({
                    appComponent: withRoutes(routes)(ConnectedRouter),
                    loaderComponent: MainLoader,
                    initialState: {
                        defaultState: {
                            ...securityState
                        }
                    },
                    pluginsConfig: localConfig.plugins || [],
                    themeCfg: null,
                    appReducers: {
                        gnsearch,
                        gnresource,
                        resourceservice,
                        security,
                        controls
                    },
                    appEpics,
                    geoNodeConfiguration
                });
            });
    });
