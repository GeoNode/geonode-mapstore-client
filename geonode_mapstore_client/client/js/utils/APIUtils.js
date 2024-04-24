/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import queryString from "query-string";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import omit from 'lodash/omit';

/**
 * Get geonode config
 * @param {string} path
 * @param {any} defaultValue
 * @return {any} value resolved
 * @module utils/APIUtils
 */
export const getGeoNodeConfig = (path = '', defaultValue = undefined) => {
    const geoNodeConfig =  window.__GEONODE_CONFIG__ || {};
    if (!isEmpty(path)) {
        return get(geoNodeConfig, path, defaultValue);
    }
    return geoNodeConfig;
};

/**
 * Get geonode local configuration by path
 * @param {string} path
 * @param {any} defaultValue
 * @return {any} value resolved
 * @module utils/APIUtils
 */
export const getGeoNodeLocalConfig = (path = '', defaultValue = undefined) => {
    const localConfig = getGeoNodeConfig('localConfig', {});
    if (!isEmpty(path)) {
        return get(localConfig, path, defaultValue);
    }
    return localConfig;
};

/**
* Utilities for api requests
* @module utils/APIUtils
*/

let geoNodeTargetHostname;

const getGeoNodeTargetHostname = () => {
    if (geoNodeTargetHostname) {
        return geoNodeTargetHostname;
    }
    const endpointV2 = getGeoNodeLocalConfig('geoNodeApi.endpointV2');
    if (endpointV2) {
        const { hostname } = url.parse(endpointV2);
        if (hostname) {
            geoNodeTargetHostname = hostname;
        }
        return hostname;
    }
    return '';
};

/**
* In development mode it returns the request with a relative path
* if the request url contain localhost:8000
* @param {string} requestUrl request url
* @return {string} correct url for localhost
*/
export const parseDevHostname = (requestUrl) => {
    if (__DEVTOOLS__) {
        if (requestUrl.includes('localhost')
        || (getGeoNodeTargetHostname() && requestUrl.includes(getGeoNodeTargetHostname()))) {
            const parsedUrl = url.parse(requestUrl, true);
            // add debug param
            const { query } = url.parse(window.location.href, true);
            return url.format({
                ...parsedUrl,
                hostname: null,
                host: null,
                protocol: null,
                port: null,
                href: null,
                slashes: null,
                query: omit(requestUrl.includes('/api/')
                    ? parsedUrl?.query
                    : {
                        ...query,
                        ...parsedUrl?.query
                    }, ['debug'])
            });
        }
    }
    return requestUrl;
};

export const getApiToken = () => {
    /*
    In case of LOCKDOWN_MODE in geonode, we need to check if the search page
    contains an APIKEY. This is required because otherwise the endpoint
    will always raise an error due the missing auth. In this way if the
    main call provide an apikey, we can proceed with the login
    */
    const geoNodePageConfig = getGeoNodeConfig();
    return geoNodePageConfig.apikey || null;
};

/**
 * Params serializer to include/exclude square brackets
 * for params with array value
 * @param {Object} params
 * @returns {Object} updated params
 */
export const paramsSerializer = () => {
    return {
        paramsSerializer: {
            serialize: params => {
                const {include, exclude, sort, ...rest} = params ?? {}; // Update bracket params (if any)
                let queryParams = '';
                if (!isEmpty(include) || !isEmpty(exclude) || !isEmpty(sort)) {
                    queryParams = queryString.stringify({include, exclude, sort}, { arrayFormat: 'bracket'});
                }
                if (!isEmpty(rest)) {
                    queryParams = (isEmpty(queryParams) ? '' : `${queryParams}&`) + queryString.stringify(rest);
                }
                return queryParams;
            }
        }
    };
};

export const API_PRESET = {
    CATALOGS: 'catalog_list',
    DATASETS: 'dataset_list',
    DOCUMENTS: 'document_list',
    MAPS: 'map_list',
    VIEWER_COMMON: 'viewer_common',
    DATASET: 'dataset_viewer',
    DOCUMENT: 'document_viewer',
    MAP: 'map_viewer'
};

export default {
    parseDevHostname,
    paramsSerializer
};
