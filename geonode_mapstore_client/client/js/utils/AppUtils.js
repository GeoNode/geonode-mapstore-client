/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    setConfigProp,
    getConfigProp,
    setLocalConfigurationFile
} from '@mapstore/framework/utils/ConfigUtils';
import {
    getSupportedLocales,
    setSupportedLocales
} from '@mapstore/framework/utils/LocaleUtils';
import { getState } from '@mapstore/framework/utils/StateUtils';
import { generateActionTrigger } from '@mapstore/framework/epics/jsapi';
import { LOCATION_CHANGE } from 'connected-react-router';
import { setRegGeoserverRule } from '@mapstore/framework/utils/LayersUtils';
import { mapSelector } from '@mapstore/framework/selectors/map';

import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';

import url from 'url';
import axios from '@mapstore/framework/libs/ajax';

let actionListeners = {};

export function getVersion() {
    if (!__DEVTOOLS__) {
        return __MAPSTORE_PROJECT_CONFIG__.version;
    }
    return 'dev';
}

export function initializeApp() {

    // Set X-CSRFToken in axios;
    axios.defaults.xsrfHeaderName = "X-CSRFToken";
    axios.defaults.xsrfCookieName = "csrftoken";

    setLocalConfigurationFile('');
    setRegGeoserverRule(/\/[\w- ]*geoserver[\w- ]*\/|\/[\w- ]*gs[\w- ]*\//);
    const pathsNeedVersion = [
        'static/mapstore/',
        'print.json'
    ];
    axios.interceptors.request.use(
        config => {
            if (config.url && pathsNeedVersion.filter(pathNeedVersion => config.url.match(pathNeedVersion))[0]) {
                return {
                    ...config,
                    params: {
                        ...config.params,
                        v: getVersion()
                    }
                };
            }
            return config;
        }
    );
}

export function getPluginsConfiguration(pluginsConfig, key) {
    if (isArray(pluginsConfig)) {
        return pluginsConfig;
    }
    if (isObject(pluginsConfig)) {
        const pluginsConfigSection = pluginsConfig[key];
        if (pluginsConfigSection) {
            // use string to link duplicated configurations
            return isString(pluginsConfigSection)
                ? pluginsConfig[pluginsConfigSection]
                : pluginsConfigSection;
        }
        return pluginsConfig;
    }
    return [];
}

export function setupConfiguration({
    localConfig,
    user,
    resourcesTotalCount
}) {
    const { query } = url.parse(window.location.href, true);
    // set the extensions path before get the localConfig
    // so it's possible to override in a custom project
    setConfigProp('extensionsRegistry', '/static/mapstore/extensions/index.json');
    const {
        supportedLocales: defaultSupportedLocales,
        ...config
    } = localConfig;
    const geoNodePageConfig = window.__GEONODE_CONFIG__ || {};
    const perms = geoNodePageConfig.perms || [];

    const canEdit = geoNodePageConfig.isNewResource || perms.indexOf('change_resourcebase') !== -1;
    const canView = geoNodePageConfig.isNewResource || perms.indexOf('view_resourcebase') !== -1;
    Object.keys(config).forEach((key) => {
        setConfigProp(key, config[key]);
    });

    setConfigProp('translationsPath', config.translationsPath
        ? config.translationsPath
        : ['/static/mapstore/gn-translations', '/static/mapstore/ms-translations']
    );
    const supportedLocales = defaultSupportedLocales || getSupportedLocales();
    setSupportedLocales(supportedLocales);
    const locale = supportedLocales[geoNodePageConfig.languageCode]?.code;
    setConfigProp('locale', locale);
    const geoNodeResourcesInfo = getConfigProp('geoNodeResourcesInfo') || {};
    setConfigProp('geoNodeResourcesInfo', { ...geoNodeResourcesInfo, ...resourcesTotalCount });
    const userDetails = geoNodePageConfig.userDetails;
    const securityState = user?.info?.access_token
        ? {
            security: {
                user: user,
                token: user.info.access_token
            }
        }
        : userDetails
            ? { security: userDetails }
            : undefined;

    // globlal window interface to interact with the django page
    const actionTrigger = generateActionTrigger(LOCATION_CHANGE);
    // similar implementation of MapStore2 API without the create part
    window.MapStoreAPI = {
        ready: true,
        getMapState: function() {
            return mapSelector(getState());
        },
        triggerAction: actionTrigger.trigger,
        onAction: (type, listener) => {
            const listeners = actionListeners[type] || [];
            listeners.push(listener);
            actionListeners[type] = listeners;
        },
        offAction: (type, listener) => {
            const listeners = (actionListeners[type] || [])
                .filter((l) => l !== listener);
            actionListeners[type] = listeners;
        }
    };
    if (window.onInitMapStoreAPI) {
        window.onInitMapStoreAPI(window.MapStoreAPI, geoNodePageConfig);
    }

    return {
        query,
        securityState,
        geoNodePageConfig,
        pluginsConfigKey: query.config || geoNodePageConfig.pluginsConfigKey,
        mapType: geoNodePageConfig.mapType,
        settings: localConfig.geoNodeSettings,
        permissions: {
            canEdit,
            canView
        },
        onStoreInit: (store) => {
            store.addActionListener((action) => {
                const act = action.type === 'PERFORM_ACTION' && action.action || action; // Needed to works also in debug
                (actionListeners[act.type] || [])
                    .concat(actionListeners['*'] || [])
                    .forEach((listener) => {
                        listener.call(null, act);
                    });
            });
        },
        configEpics: {
            gnMapStoreApiEpic: actionTrigger.epic
        }
    };
}
