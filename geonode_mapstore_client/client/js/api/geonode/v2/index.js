/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import {
    parseDevHostname,
    setRequestOptions,
    getRequestOptions
} from '@js/utils/APIUtils';
import merge from 'lodash/merge';
import mergeWith from 'lodash/mergeWith';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import castArray from 'lodash/castArray';
import get from 'lodash/get';
import { getUserInfo } from '@js/api/geonode/v1';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { setFilterById } from '@js/utils/GNSearchUtils';

let endpoints = {
    // default values
    'resources': '/api/v2/resources',
    'documents': '/api/v2/documents',
    'layers': '/api/v2/layers',
    'maps': '/api/v2/maps',
    'geoapps': '/api/v2/geoapps',
    'geostories': '/api/v2/geostories',
    'dashboards': '/api/v2/dashboards',
    'users': '/api/v2/users',
    'resource_types': '/api/v2/resources/resource_types'
};

const RESOURCES = 'resources';
const DOCUMENTS = 'documents';
const LAYERS = 'layers';
const MAPS = 'maps';
const GEOAPPS = 'geoapps';
const GEOSTORIES = 'geostories';
const DASHBOARDS = 'dashboards';
const USERS = 'users';
const RESOURCE_TYPES = 'resource_types';
// const GROUPS = 'groups';

const requestOptions = (name, requestFunc) => {
    const options = getRequestOptions(name);
    if (!options) {
        return axios.options(parseDevHostname(endpoints[name]))
            .then(({ data }) => {
                setRequestOptions(name, data);
                return requestFunc(data);
            })
            .catch(() => {
                const error = { error: true };
                setRequestOptions(name, error);
                return requestFunc(error);
            });
    }
    return requestFunc(options);
};

// some fields such as search_fields does not support the array notation `key[]=value1&key[]=value2`
// this function will parse all values included array in the `key=value1&key=value2` format
function addQueryString(requestUrl, params) {
    if (!params) {
        return requestUrl;
    }
    const queryString = Object.keys(params)
        .reduce((str, key, idx) => {
            const start = idx === 0 ? '?' : '&';
            const values = castArray(params[key]);
            if (values.length > 1) {
                return str + values.reduce((valStr, value, jdx) => {
                    return valStr + (jdx === 0 ? start : '&') + key + '=' + value;
                }, '');
            }
            return str + start + key + '=' + values[0];
        }, '');
    return `${requestUrl}${queryString}`;
}

export const setEndpoints = (data) => {
    endpoints = { ...endpoints, ...data };
};

export const getEndpoints = () => {
    return axios.get('/api/v2/')
        .then(({ data }) => {
            setEndpoints(data);
            return data;
        });
};

function mergeCustomQuery(params, customQuery) {
    if (customQuery) {
        return mergeWith(
            { ...params },
            { ...customQuery },
            (objValue, srcValue) => {
                if (isArray(objValue) && isArray(srcValue)) {
                    return [...objValue, ...srcValue];
                }
                if (isString(objValue) && isArray(srcValue)) {
                    return [objValue, ...srcValue];
                }
                if (isArray(objValue) && isString(srcValue)) {
                    return [...objValue, srcValue];
                }
                if (isString(objValue) && isString(srcValue)) {
                    return [ objValue, srcValue ];
                }
                return undefined; // eslint-disable-line consistent-return
            }
        );
    }
    return params;
}

export const getResources = ({
    q,
    pageSize = 20,
    page = 1,
    sort,
    f,
    ...params
}) => {
    const { query: customQuery } = (getConfigProp('menuFilters') || [])
        .find(({ id }) => f === id) || {};

    return requestOptions(RESOURCES, () => axios.get(parseDevHostname(
        addQueryString(endpoints[RESOURCES], q && {
            search: q,
            search_fields: ['title', 'abstract']
        })
    ), {
        params: {
            ...mergeCustomQuery(params, customQuery),
            ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
            page,
            page_size: pageSize
        }
    })
        .then(({ data }) => {
            return {
                isNextPageAvailable: !!data.links.next,
                resources: (data.resources || [])
                    .map((resource) => {
                        return resource;
                    })
            };
        }));
};

export const getMaps = ({
    q,
    pageSize = 20,
    page = 1,
    sort,
    ...params
}) => {
    return requestOptions(MAPS, () => axios
        .get(
            parseDevHostname(
                addQueryString(endpoints[MAPS], q && {
                    search: q,
                    search_fields: ['title', 'abstract']
                })
            ), {
                // axios will format query params array to `key[]=value1&key[]=value2`
                params: {
                    ...params,
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    page,
                    page_size: pageSize
                }
            })
        .then(({ data }) => {
            return {
                totalCount: data.total,
                isNextPageAvailable: !!data.links.next,
                resources: (data.maps || [])
                    .map((resource) => {
                        return resource;
                    })
            };
        }));
};

export const getDocumentsByDocType = (docType = 'image', {
    q,
    pageSize = 20,
    page = 1,
    sort,
    ...params
}) => {

    return requestOptions(MAPS, () => axios
        .get(
            parseDevHostname(
                addQueryString(endpoints[DOCUMENTS], q && {
                    search: q,
                    search_fields: ['title', 'abstract']
                })
            ), {
                // axios will format query params array to `key[]=value1&key[]=value2`
                params: {
                    ...params,
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    'filter{doc_type}': [docType],
                    page,
                    page_size: pageSize
                }
            })
        .then(({ data }) => {
            return {
                totalCount: data.total,
                isNextPageAvailable: !!data.links.next,
                resources: (data.documents || [])
                    .map((resource) => {
                        return resource;
                    })
            };
        }));
};

export const getResourceByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[RESOURCES]}/${pk}`))
        .then(({ data }) => data.resource);
};

export const createGeoApp = (body) => {
    return axios.post(parseDevHostname(`${endpoints[GEOAPPS]}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.resource);
};

export const createGeoStory = (body) => {
    return axios.post(parseDevHostname(`${endpoints[GEOSTORIES]}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.geostory);
};

export const updateGeoStory = (pk, body) => {
    return axios.patch(parseDevHostname(`${endpoints[GEOSTORIES]}/${pk}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.geostory);
};

export const createDashboard = (body) => {
    return axios.post(parseDevHostname(`${endpoints[DASHBOARDS]}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.dashboard);
};

export const updateDashboard = (pk, body) => {
    return axios.patch(parseDevHostname(`${endpoints[DASHBOARDS]}/${pk}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.dashboard);
};

export const getUserByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[USERS]}/${pk}`))
        .then(({ data }) => data.user);
};

export const getAccountInfo = () => {
    return getUserInfo()
        .then((info) => {
            return getUserByPk(info.sub)
                .then((user) => ({
                    ...user,
                    info,
                    // TODO: remove when the href is provided by the server
                    hrefProfile: `/people/profile/${user.username}/`
                }))
                .catch(() => ({ info }));
        })
        .catch(() => null);
};

export const getConfiguration = (configUrl = '/static/mapstore/configs/localConfig.json') => {
    return axios.get(configUrl)
        .then(({ data }) => {
            const geoNodePageConfig = window.__GEONODE_CONFIG__ || {};
            const localConfig = mergeWith(
                data,
                geoNodePageConfig.localConfig || {},
                (objValue, srcValue) => {
                    if (isArray(objValue)) {
                        return srcValue;
                    }
                    return undefined; // eslint-disable-line consistent-return
                });
            if (geoNodePageConfig.overrideLocalConfig) {
                return geoNodePageConfig.overrideLocalConfig(localConfig, {
                    mergeWith,
                    merge,
                    isArray,
                    isString,
                    isObject,
                    castArray,
                    get
                });
            }
            return localConfig;
        });
};


let availableResourceTypes;
export const getResourceTypes = ({}, filterKey = 'resource-types') => {
    if (availableResourceTypes) {
        return new Promise(resolve => resolve(availableResourceTypes));
    }
    return axios.get(parseDevHostname(endpoints[RESOURCE_TYPES]))
        .then(({ data }) => {
            availableResourceTypes = (data?.resource_types || [])
                .map((value) => {
                    const selectOption = {
                        value: value,
                        label: value
                    };
                    const resourceType = {
                        value,
                        selectOption
                    };
                    setFilterById(filterKey + value, resourceType);
                    return resourceType;
                });
            return [...availableResourceTypes];
        });
};

export const getLayerByName = name => {
    const url = parseDevHostname(`${endpoints[LAYERS]}/?filter{alternate}=${name}`);
    return axios.get(url)
        .then(({data}) => data?.layers[0]);
};

export const getLayersByName = names => {
    const url = parseDevHostname(endpoints[LAYERS]);
    return axios.get(url, {
        params: {
            page_size: names.length,
            'filter{alternate.in}': names
        }
    })
        .then(({data}) => data?.layers);
};

export const getResourcesTotalCount = () => {
    const params = {
        page_size: 1
    };
    const types = [
        DOCUMENTS,
        LAYERS,
        MAPS,
        GEOSTORIES,
        GEOAPPS
    ];
    return axios.all(
        types.map((type) =>
            axios.get(parseDevHostname(endpoints[type]), { params })
                .then(({ data }) => data.total)
                .catch(() => null)
        )
    )
        .then(([
            documentsTotalCount,
            layersTotalCount,
            mapsTotalCount,
            geostoriesTotalCount,
            geoappsTotalCount
        ]) => {
            return {
                documentsTotalCount,
                layersTotalCount,
                mapsTotalCount,
                geostoriesTotalCount,
                geoappsTotalCount
            };
        });
};

export default {
    getEndpoints,
    getResources,
    getResourceByPk,
    createGeoApp,
    createGeoStory,
    updateGeoStory,
    createDashboard,
    updateDashboard,
    getMaps,
    getDocumentsByDocType,
    getUserByPk,
    getAccountInfo,
    getConfiguration,
    getResourceTypes,
    getResourcesTotalCount
};
