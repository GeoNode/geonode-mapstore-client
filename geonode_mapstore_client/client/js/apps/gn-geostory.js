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
import GeoStory from '@js/routes/GeoStory';
import Router, { withRoutes } from '@js/components/app/Router';
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
import {
    setResourceType,
    setNewResource,
    setResourceId,
    setResourcePermissions
} from '@js/actions/gnresource';
import { updateGeoNodeSettings } from '@js/actions/gnsettings';
import { setCurrentStory } from '@mapstore/framework/actions/geostory';
import isMobile from 'ismobilejs';
import uuid from 'uuid';
import {
    setupConfiguration,
    getVersion,
    initializeApp,
    getPluginsConfiguration,
    storeEpicsCache
} from '@js/utils/AppUtils';
import pluginsDefinition from '@js/plugins/index';
import ReactSwipe from 'react-swipeable-views';
import SwipeHeader from '@mapstore/framework/components/data/identify/SwipeHeader';
const requires = {
    ReactSwipe,
    SwipeHeader
};

registerMediaAPI('geonode', geoNodeMediaApi);

// TODO: check styles on less files
import 'react-select/dist/react-select.css';

const DEFAULT_LOCALE = {};
const ConnectedRouter = connect((state) => ({
    locale: state?.locale || DEFAULT_LOCALE
}))(Router);

const routes = [{
    name: 'geostory',
    path: '/',
    component: GeoStory
}];

const newStoryTemplate = {
    "type": "cascade",
    "resources": [],
    "settings": {
        "theme": {
            "general": {
                "color": "#333333",
                "backgroundColor": "#ffffff",
                "borderColor": "#e6e6e6"
            },
            "overlay": {
                "backgroundColor": "rgba(255, 255, 255, 0.75)",
                "borderColor": "#dddddd",
                "boxShadow": "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)",
                "color": "#333333"
            }
        }
    },
    "sections": [
        {
            "type": "title",
            "id": "section_id",
            "title": "Abstract",
            "cover": true,
            "contents": [
                {
                    "id": "content_id",
                    "type": "text",
                    "size": "large",
                    "align": "center",
                    "theme": "",
                    "html": "",
                    "background": {
                        "fit": "cover",
                        "size": "full",
                        "align": "center"
                    }
                }
            ]
        }
    ]
};

initializeApp();

document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        getConfiguration(),
        getAccountInfo(),
        getEndpoints()
    ])
        .then(([localConfig, user]) => {
            const {
                securityState,
                pluginsConfigKey,
                geoNodePageConfig,
                query,
                configEpics,
                permissions,
                onStoreInit,
                targetId = 'ms-container',
                settings
            } = setupConfiguration({ localConfig, user });

            const currentStory = geoNodePageConfig.isNewResource
                // change id of new story sections and contents
                ? {
                    ...newStoryTemplate,
                    sections: newStoryTemplate?.sections
                        .map((section) => {
                            return {
                                ...section,
                                id: uuid(),
                                contents: section?.contents
                                    .map((content) => {
                                        return {
                                            ...content,
                                            id: uuid()
                                        };
                                    }) || []
                            };
                        }) || []
                }
                : geoNodePageConfig.resourceConfig;

            const appEpics = {
                ...configEpics
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
                        maptype: {
                            mapType: 'openlayers'
                        },
                        ...securityState,
                        geostory: {
                            isCollapsed: false,
                            focusedContent: {},
                            currentPage: {},
                            settings: {},
                            oldSettings: {},
                            updateUrlOnScroll: false,
                            currentStory: {},
                            mode: geoNodePageConfig.isEmbed || isMobile.any || !permissions.canEdit ? 'view' : 'edit',
                            resource: {
                                canEdit: permissions.canEdit
                            }
                        }
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
                    geostory,
                    gnresource,
                    gnsettings,
                    security,
                    maptype
                },
                appEpics,
                onStoreInit,
                initialActions: [
                    // add some settings in the global state to make them accessible in the monitor state
                    // later we could use expression in localConfig
                    updateGeoNodeSettings.bind(null, settings),
                    setCurrentStory.bind(null, currentStory),
                    setResourceType.bind(null, 'geostory'),
                    setResourcePermissions.bind(null, permissions),
                    ...(geoNodePageConfig.resourceId ? [setResourceId.bind(null, geoNodePageConfig.resourceId)] : []),
                    ...(geoNodePageConfig.isNewResource ? [setNewResource] : [])
                ]
            });
        });

});
