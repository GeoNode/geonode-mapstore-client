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
import { getUserInfo } from '@js/api/geonode/user';
import { setFilterById } from '@js/utils/SearchUtils';
import { ResourceTypes } from '@js/utils/ResourceUtils';

/**
 * Actions for GeoNode save workflow
 * @module api/geonode/v2
 */

let endpoints = {
    // default values
    'resources': '/api/v2/resources',
    'documents': '/api/v2/documents',
    'datasets': '/api/v2/datasets',
    'maps': '/api/v2/maps',
    'geoapps': '/api/v2/geoapps',
    'users': '/api/v2/users',
    'resource_types': '/api/v2/resources/resource_types',
    'categories': '/api/v2/categories',
    'owners': '/api/v2/owners',
    'keywords': '/api/v2/keywords',
    'regions': '/api/v2/regions',
    'groups': '/api/v2/groups'
};

const RESOURCES = 'resources';
const DOCUMENTS = 'documents';
const DATASETS = 'datasets';
const MAPS = 'maps';
const GEOAPPS = 'geoapps';
const USERS = 'users';
const RESOURCE_TYPES = 'resource_types';
const OWNERS = 'owners';
const REGIONS = 'regions';
const CATEGORIES = 'categories';
const KEYWORDS = 'keywords';
const GROUPS = 'groups';


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

/**
 * get all thw endpoints available from API V2
 */
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
                    'filter{subtype}': [docType],
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

export const setMapThumbnail = (pk, body) => {
    return axios.post(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/set_thumbnail_from_bbox`), body)
        .then(({ data }) => (data));
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

export const getResourceByUuid = (uuid) => {
    return axios.get(parseDevHostname(`${endpoints[RESOURCES]}`), {
        params: {
            'filter{uuid}': uuid
        }
    })
        .then(({ data }) => data?.resources?.[0]);
};

export const getDatasetByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[DATASETS]}/${pk}`))
        .then(({ data }) => data.dataset);
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
        .then(({ data }) => data.geoapp);
};

export const getGeoAppByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[GEOAPPS]}/${pk}`), {
        params: {
            full: true,
            include: ['data']
        }
    })
        .then(({ data }) => data.geoapp);
};


export const updateGeoApp = (pk, body) => {
    return axios.patch(parseDevHostname(`${endpoints[GEOAPPS]}/${pk}`), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.geoapp);
};


export const updateDataset = (pk, body) => {
    return axios.patch(parseDevHostname(`${endpoints[DATASETS]}/${pk}`), body)
        .then(({ data }) => (data.dataset));
};

export const updateDocument = (pk, body) => {
    return axios.patch(parseDevHostname(`${endpoints[DOCUMENTS]}/${pk}`), body)
        .then(({ data }) => data.document);
};

export const getUsers = ({
    q,
    page = 1,
    pageSize = 20,
    ...params
} = {}) => {
    return axios.get(
        parseDevHostname(
            addQueryString(endpoints[USERS], q && {
                search: q,
                search_fields: ['username', 'first_name', 'last_name']
            })
        ),
        {
            params: {
                ...params,
                page,
                page_size: pageSize
            }
        })
        .then(({ data }) => {
            return {
                total: data.total,
                isNextPageAvailable: !!data.links.next,
                users: data.users
            };
        });
};

export const getGroups = ({
    q,
    page = 1,
    pageSize = 20,
    ...params
} = {}) => {
    return axios.get(
        parseDevHostname(
            addQueryString(endpoints[GROUPS], q && {
                search: q,
                search_fields: ['title', 'slug']
            })
        ),
        {
            params: {
                ...params,
                page,
                page_size: pageSize
            }
        })
        .then(({ data }) => {
            return {
                total: data.total,
                isNextPageAvailable: !!data.links.next,
                groups: data.group_profiles
            };
        });
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

export const getDatasetByName = name => {
    const url = parseDevHostname(`${endpoints[DATASETS]}/?filter{alternate}=${name}`);
    return axios.get(url)
        .then(({data}) => data?.datasets[0]);
};

export const getDatasetsByName = names => {
    const url = parseDevHostname(endpoints[DATASETS]);
    return axios.get(url, {
        params: {
            page_size: names.length,
            'filter{alternate.in}': names
        }
    })
        .then(({data}) => data?.datasets);
};

export const getResourcesTotalCount = () => {
    return axios.get('/api/v2/resources/resource_types')
        .then(({ data }) => data.resource_types)
        .then((resourceTypes) => {
            const keysMap = {
                [ResourceTypes.DOCUMENT]: 'documentsTotalCount',
                [ResourceTypes.DATASET]: 'datasetsTotalCount',
                [ResourceTypes.MAP]: 'mapsTotalCount',
                [ResourceTypes.GEOSTORY]: 'geostoriesTotalCount',
                [ResourceTypes.DASHBOARD]: 'dashboardsTotalCount'
            };
            const totalCount = resourceTypes.reduce((acc, { name, count }) => ({
                ...acc,
                [keysMap[name]]: count || 0
            }), {});
            return totalCount;
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

export const getCategories = ({ q, includes, page, pageSize, ...params }, filterKey = 'categories') => {
    return axios.get(parseDevHostname(`${endpoints[CATEGORIES]}`), {
        params: {
            page_size: pageSize || 9999,
            page,
            ...params,
            ...(includes && {'filter{identifier.in}': includes}),
            ...(q && { 'filter{identifier.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.categories || [])
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
            return {
                results,
                total: data.total,
                isNextPageAvailable: !!data.links.next
            };
        });
};

export const getRegions = ({ q, includes, page, pageSize, ...params }, filterKey = 'regions') => {
    return axios.get(parseDevHostname(`${endpoints[REGIONS]}`), {
        params: {
            page_size: pageSize || 9999,
            page,
            ...params,
            ...(includes && {'filter{name.in}': includes}),
            ...(q && { 'filter{name.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.regions || [])
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
            return {
                results,
                total: data.total,
                isNextPageAvailable: !!data.links.next
            };
        });
};

export const getOwners = ({ q, includes, page, pageSize, ...params }, filterKey = 'owners') => {
    return axios.get(parseDevHostname(`${endpoints[OWNERS]}`), {
        params: {
            page_size: pageSize || 9999,
            page,
            ...params,
            ...(includes && {'filter{username.in}': includes}),
            ...(q && { 'filter{username.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.owners || [])
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
            return {
                results,
                total: data.total,
                isNextPageAvailable: !!data.links.next
            };
        });
};

export const getKeywords = ({ q, includes, page, pageSize, ...params }, filterKey =  'keywords') => {
    return axios.get(parseDevHostname(`${endpoints[KEYWORDS]}`), {
        params: {
            page_size: pageSize || 9999,
            page,
            ...params,
            ...(includes && {'filter{slug.in}': includes}),
            ...(q && { 'filter{slug.icontains}': q })
        }
    })
        .then(({ data }) => {
            const results = (data?.keywords || [])
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
            return {
                results,
                total: data.total,
                isNextPageAvailable: !!data.links.next
            };
        });
};

export const getCompactPermissionsByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/permissions`))
        .then(({ data }) => data);
};

export const updateCompactPermissionsByPk = (pk, body) => {
    return axios.put(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/permissions`), 'permissions=' + JSON.stringify(body))
        .then(({ data }) => data);
};

export const deleteResource = (resource) => {
    return axios.delete(parseDevHostname(`${endpoints[RESOURCES]}/${resource.pk}/delete`))
        .then(({ data }) => data);
};

export const copyResource = (resource) => {
    const defaults = {
        title: resource.title,
        ...(resource.data && { data: resource.data })
    };
    return axios.put(parseDevHostname(`${endpoints[RESOURCES]}/${resource.pk}/copy`), 'defaults=' + JSON.stringify(defaults))
        .then(({ data }) => data);
};

export default {
    getEndpoints,
    getResources,
    getResourceByPk,
    getResourceByUuid,
    createGeoApp,
    getGeoAppByPk,
    updateDataset,
    updateGeoApp,
    getMaps,
    getDocumentsByDocType,
    getUserByPk,
    getUsers,
    getAccountInfo,
    getConfiguration,
    getResourceTypes,
    getResourcesTotalCount,
    getDatasetByPk,
    getDocumentByPk,
    createMap,
    updateMap,
    getMapByPk,
    getCategories,
    getRegions,
    getOwners,
    getKeywords,
    getCompactPermissionsByPk,
    updateCompactPermissionsByPk,
    deleteResource,
    copyResource
};
