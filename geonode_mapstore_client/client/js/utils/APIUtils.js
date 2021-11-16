/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';

let requestOptions = {};

/**
* Utilities for api requests
* @module utils/APIUtils
*/

/**
* In development mode it returns the request with a relative path
* if the request url contain localhost:8000
* @param {string} requestUrl request url
* @return {string} correct url for localhost
*/
export const parseDevHostname = (requestUrl) => {
    if (__DEVTOOLS__ && requestUrl.indexOf('localhost') !== -1) {
        const parsedUrl = url.parse(requestUrl);
        return url.format({
            ...parsedUrl,
            hostname: null,
            host: null,
            protocol: null,
            port: null,
            href: null,
            slashes: null
        });
    }
    return requestUrl;
};

export const setRequestOptions = (name, options) => { requestOptions[name] = options; };
export const getRequestOptions = name => requestOptions[name];

export default {
    parseDevHostname,
    setRequestOptions,
    getRequestOptions
};
