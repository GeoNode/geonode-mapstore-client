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
import { setFilterById } from '@js/utils/GNSearchUtils';

let endpoints = {
    // default values
    'resources': '/api/v2/resources',
    'documents': '/api/v2/documents',
    'layers': '/api/v2/layers',
    'maps': '/api/v2/maps',
    'geoapps': '/api/v2/geoapps',
    'geostories': '/api/v2/geostories',
    'users': '/api/v2/users',
    'resource_types': '/api/v2/resources/resource_types',
    'categories': '/api/v2/categories',
    'owners': '/api/v2/owners',
    'keywords': '/api/v2/keywords',
    'regions': '/api/v2/regions'
};

const RESOURCES = 'resources';
const DOCUMENTS = 'documents';
const LAYERS = 'layers';
const MAPS = 'maps';
const GEOAPPS = 'geoapps';
const GEOSTORIES = 'geostories';
const USERS = 'users';
const RESOURCE_TYPES = 'resource_types';
const OWNERS = 'owners';
const REGIONS = 'regions';
const CATEGORIES = 'categories';
const KEYWORDS = 'keywords';

// const GROUPS = 'groups';

function addCountToLabel(name, count) {
    return `${name} (${count || 0})`;
}

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
    customFilters = [],
    ...params
}) => {

    const customQuery = customFilters
        .filter(({ id }) => castArray(f || []).indexOf(id) !== -1)
        .reduce((acc, filter) => mergeCustomQuery(acc, filter.query || {}), {}) || {};

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
            page_size: pageSize,
            'filter{metadata_only}': false // exclude resources such as services
        }
    })
        .then(({ data }) => {
            return {
                total: data.total,
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


export const setFavoriteResource = (pk, favorite) => {
    const request = favorite ? axios.post : axios.delete;
    return request(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/favorite`))
        .then(({ data }) => data );
};

export const getResourceByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[RESOURCES]}/${pk}`))
        .then(({ data }) => data.resource);
};

export const getLayerByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[LAYERS]}/${pk}`))
        .then(({ data }) => data.layer);
};

export const getDocumentByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[DOCUMENTS]}/${pk}`))
        .then(({ data }) => data.document);
};

export const createGeoApp = (body) => {
    return axios.post(parseDevHostname(`${endpoints[GEOAPPS]}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.resource);
};

export const getGeoAppByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[GEOAPPS]}/${pk}`), {
        params: {
            full: true
        }
    })
        .then(({ data }) => data.geoapp);
};

export const createGeoStory = (body) => {
    return axios.post(parseDevHostname(`${endpoints[GEOSTORIES]}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.geostory);
};

export const getGeoStoryByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[GEOSTORIES]}/${pk}`), {
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

export const updateDocument = (pk, body) => {
    return axios.patch(parseDevHostname(`${endpoints[DOCUMENTS]}/${pk}`), body)
        .then(({ data }) => data.document);
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
                        return [...objValue, ...srcValue];
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
                .map((type) => {
                    // replace the string with object
                    // as soon the backend support object results
                    // currently it's supporting only string response
                    const selectOption = isObject(type)
                        ? {
                            value: type.name,
                            label: `${type.name} (${type.count || 0})`
                        }
                        : {
                            value: type,
                            label: type
                        };
                    const resourceType = {
                        value: selectOption.value,
                        selectOption
                    };
                    setFilterById(filterKey + selectOption.value, resourceType);
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

/**
* Create a new MapStore map configuration
* @memberof api.geonode.adapter
* @param {object} body new map configuration
* @return {promise} it returns an object with the success map object response
*/
export const createMap = (body = {}) => {
    return axios.post(parseDevHostname(`${endpoints[MAPS]}`),
        body,
        {
            timeout: 10000
        })
        .then(({ data }) => data?.map);
};

/**
* Update an existing MapStore map configuration
* @memberof api.geonode.adapter
* @param {number|string} id resource id
* @param {object} body map configuration
* @return {promise} it returns an object with the success map object response
*/
export const updateMap = (id, body = {}) => {
    return axios.patch(parseDevHostname(`${endpoints[MAPS]}/${id}/`),
        body,
        {
            params: {
                include: ['data']
            }
        })
        .then(({ data }) => data?.map);
};

/**
* Get a map configuration
* @memberof api.geonode.adapter
* @param {number|string} id resource id
* @return {promise} it returns an object with the success map object response
*/
export const getMapByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[MAPS]}/${pk}/`),
        {
            params: {
                include: ['data']
            }
        })
        .then(({ data }) => data?.map);
};

export const getFeaturedResources = (page = 1, page_size =  4) => {
    return axios.get(parseDevHostname(endpoints[RESOURCES]), {
        params: {
            page_size,
            page,
            'filter{featured}': true
        }
    }).then(({data}) => data);
};

export const getCategories = ({ q, idIn, ...params }, filterKey = 'categories') => {
    return axios.get(parseDevHostname(`${endpoints[CATEGORIES]}`), {
        params: {
            page_size: 9999,
            ...params,
            ...(idIn && {'filter{identifier.in}': idIn}),
            ...(q && { 'filter{identifier.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.TopicCategories || [])
                .map((result) => {
                    const selectOption = {
                        value: result.identifier,
                        label: addCountToLabel(result.gn_description || result.gn_description_en, result.count)
                    };
                    const category = {
                        ...result,
                        selectOption
                    };
                    setFilterById(filterKey + result.identifier, category);
                    return category;
                });
            return results;
        });
};

export const getRegions = ({ q, idIn, ...params }, filterKey = 'regions') => {
    return axios.get(parseDevHostname(`${endpoints[REGIONS]}`), {
        params: {
            page_size: 9999,
            ...params,
            ...(idIn && {'filter{name.in}': idIn}),
            ...(q && { 'filter{name.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.Regions || [])
                .map((result) => {
                    const selectOption = {
                        value: result.name,
                        label: addCountToLabel(result.name, result.count)
                    };
                    const region = {
                        ...result,
                        selectOption
                    };
                    setFilterById(filterKey + result.name, region);
                    return region;
                });
            return results;
        });
};

export const getOwners = ({ q, idIn, ...params }, filterKey = 'owners') => {
    return axios.get(parseDevHostname(`${endpoints[OWNERS]}`), {
        params: {
            page_size: 9999,
            ...params,
            ...(idIn && {'filter{username.in}': idIn}),
            ...(q && { 'filter{username.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.users || [])
                .map((result) => {
                    const selectOption = {
                        value: result.username,
                        label: addCountToLabel(result.username, result.count)
                    };
                    const owner = {
                        ...result,
                        selectOption
                    };
                    setFilterById(filterKey + result.username, owner);
                    return owner;
                });
            return results;
        });
};

export const getKeywords = ({ q, idIn, ...params }, filterKey =  'keywords') => {
    return axios.get(parseDevHostname(`${endpoints[KEYWORDS]}`), {
        params: {
            page_size: 9999,
            ...params,
            ...(idIn && {'filter{slug.in}': idIn}),
            ...(q && { 'filter{slug.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.HierarchicalKeywords || [])
                .map((result) => {

                    const selectOption = {
                        value: result.slug,
                        label: addCountToLabel(result.slug, result.count)
                    };
                    const keyword = {
                        ...result,
                        selectOption
                    };
                    setFilterById(filterKey + result.slug, keyword);
                    return keyword;
                });
            return results;
        });
};
export default {
    getEndpoints,
    getResources,
    getResourceByPk,
    createGeoApp,
    getGeoAppByPk,
    createGeoStory,
    getGeoStoryByPk,
    updateGeoStory,
    getMaps,
    getDocumentsByDocType,
    getUserByPk,
    getAccountInfo,
    getConfiguration,
    getResourceTypes,
    getResourcesTotalCount,
    getLayerByPk,
    getDocumentByPk,
    createMap,
    updateMap,
    getMapByPk,
    getCategories,
    getRegions,
    getOwners,
    getKeywords
};
