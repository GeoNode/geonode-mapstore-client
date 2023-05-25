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
    getApiToken,
    paramsSerializer
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
import { ResourceTypes, availableResourceTypes, setAvailableResourceTypes } from '@js/utils/ResourceUtils';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { mergeConfigsPatch } from '@mapstore/patcher';

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
    'groups': '/api/v2/groups',
    'uploads': '/api/v2/uploads',
    'status': '/api/v2/resource-service/execution-status',
    'exectionRequest': '/api/v2/executionrequest',
    'facets': '/api/v2/facets'
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
const UPLOADS = 'uploads';
const STATUS = 'status';
const EXECUTIONREQUEST = 'exectionRequest';
const FACETS = 'facets';

function addCountToLabel(name, count) {
    return `${name} (${count || 0})`;
}

export const setEndpoints = (data) => {
    endpoints = { ...endpoints, ...data };
};

/**
 * get all thw endpoints available from API V2
 */
export const getEndpoints = () => {
    const apikey = getApiToken();
    return axios.get('/api/v2/', {
        params: {
            ...(apikey && { apikey })
        }
    })
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
    const _mergeCustomQueryParams = mergeCustomQuery(params, customQuery);
    const _params = {
        ..._mergeCustomQueryParams,
        ...(q && {
            search: q,
            search_fields: ['title', 'abstract']
        }),
        ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
        page,
        page_size: pageSize,
        'filter{metadata_only}': false, // exclude resources such as services
        include: ['executions']
    };
    return axios.get(parseDevHostname(endpoints[RESOURCES]), {
        params: _params,
        paramsSerializer
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
        });
};

export const getMaps = ({
    q,
    pageSize = 20,
    page = 1,
    sort,
    ...params
}) => {
    return axios
        .get(
            parseDevHostname(endpoints[MAPS]), {
                // axios will format query params array to `key[]=value1&key[]=value2`
                params: {
                    ...params,
                    ...(q && {
                        search: q,
                        search_fields: ['title', 'abstract']
                    }),
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    page,
                    page_size: pageSize
                },
                paramsSerializer
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
        });
};

export const getDatasets = ({
    q,
    pageSize = 20,
    page = 1,
    sort,
    ...params
}) => {
    return axios
        .get(
            parseDevHostname(endpoints[DATASETS]), {
                // axios will format query params array to `key[]=value1&key[]=value2`
                params: {
                    ...params,
                    ...(q && {
                        search: q,
                        search_fields: ['title', 'abstract']
                    }),
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    page,
                    page_size: pageSize
                },
                paramsSerializer
            })
        .then(({ data }) => {
            return {
                totalCount: data.total,
                isNextPageAvailable: !!data.links.next,
                resources: (data.datasets || [])
                    .map((resource) => {
                        return resource;
                    })
            };
        });
};

export const getDocumentsByDocType = (docType = 'image', {
    q,
    pageSize = 20,
    page = 1,
    sort,
    ...params
}) => {

    return axios
        .get(
            parseDevHostname(endpoints[DOCUMENTS]), {
                params: {
                    ...params,
                    ...(q && {
                        search: q,
                        search_fields: ['title', 'abstract']
                    }),
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    'filter{subtype}': [docType],
                    page,
                    page_size: pageSize
                },
                paramsSerializer
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
        });
};

export const setMapThumbnail = (pk, body) => {
    return axios.post(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/set_thumbnail_from_bbox`), body)
        .then(({ data }) => (data));
};

export const setResourceThumbnail = (pk, body) => {
    return axios.put(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/set_thumbnail`), body)
        .then(({ data }) => data);
};

export const setFavoriteResource = (pk, favorite) => {
    const request = favorite ? axios.post : axios.delete;
    return request(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/favorite`))
        .then(({ data }) => data );
};

export const getResourceByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[RESOURCES]}/${pk}`), {
        params: {
            include: ['executions']
        }
    })
        .then(({ data }) => data.resource);
};

export const getLinkedResourcesByPk = (pk) => {
    return axios.get(parseDevHostname(`${endpoints[RESOURCES]}/${pk}/linked_resources`), {
        params: {
            'page': 1,
            'page_size': 99999
        }
    })
        .then(({ data }) => data.resources ?? []);
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
    return axios.get(parseDevHostname(`${endpoints[DOCUMENTS]}/${pk}`), {
        params: {
            include: ['executions']
        }
    })
        .then(({ data }) => data.document);
};

export const getDocumentsByPk = (pk) => {
    const pks = castArray(pk);
    return axios.get(parseDevHostname(`${endpoints[DOCUMENTS]}/`), {
        params: {
            'filter{pk.in}': pks,
            page_size: pks.length
        },
        paramsSerializer
    })
        .then(({ data }) => data.documents);
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
        parseDevHostname(endpoints[USERS]),
        {
            params: {
                ...params,
                ...(q && {
                    search: q,
                    search_fields: ['username', 'first_name', 'last_name']
                }),
                page,
                page_size: pageSize
            },
            paramsSerializer
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
        parseDevHostname(endpoints[GROUPS]),
        {
            params: {
                ...params,
                ...(q && {
                    search: q,
                    search_fields: ['title', 'slug']
                }),
                page,
                page_size: pageSize
            },
            paramsSerializer
        })
        .then(({ data }) => {
            return {
                total: data.total,
                isNextPageAvailable: !!data.links.next,
                groups: data.group_profiles
            };
        });
};

export const getUserByPk = (pk, apikey) => {
    return axios.get(parseDevHostname(`${endpoints[USERS]}/${pk}`), {
        params: {
            ...(apikey && { apikey })
        }
    })
        .then(({ data }) => data.user);
};

export const getAccountInfo = () => {
    const apikey = getApiToken();
    return getUserInfo(apikey)
        .then((info) => {
            return getUserByPk(info.sub, apikey)
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
            const geoNodePageLocalConfig = geoNodePageConfig.localConfig || {};
            const pluginsConfigPatchRules = geoNodePageConfig.pluginsConfigPatchRules || [];

            const mergedLocalConfig  = mergeWith(
                data,
                geoNodePageLocalConfig,
                (objValue, srcValue) => {
                    if (isArray(objValue)) {
                        return [...objValue, ...srcValue];
                    }
                    return undefined; // eslint-disable-line consistent-return
                });

            // change plugins config based on patches provided in settings.py
            const plugins = pluginsConfigPatchRules.length > 0
                ? mergeConfigsPatch(mergedLocalConfig.plugins, pluginsConfigPatchRules)
                : mergedLocalConfig.plugins;

            const localConfig = {
                ...mergedLocalConfig,
                plugins
            };

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

export const getResourceTypes = () => {
    if (availableResourceTypes) {
        return new Promise(resolve => resolve(availableResourceTypes));
    }
    return axios.get(parseDevHostname(endpoints[RESOURCE_TYPES]))
        .then(({ data }) => {
            setAvailableResourceTypes(data?.resource_types || []);
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
    return axios.post(parseDevHostname(`${endpoints[MAPS]}`), body)
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

export const getMapsByPk = (pk) => {
    const pks = castArray(pk);
    return axios.get(parseDevHostname(`${endpoints[MAPS]}/`),
        {
            params: {
                include: ['data'],
                'filter{pk.in}': pks,
                page_size: pks.length
            },
            paramsSerializer
        })
        .then(({ data }) => data?.maps);
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

export const getCategories = ({ q, includes, page, pageSize, config, ...params }, filterKey = 'categories') => {
    return axios.get(parseDevHostname(`${endpoints[CATEGORIES]}`), {
        ...config,
        params: {
            page_size: pageSize || 9999,
            page,
            ...params,
            ...(includes && {'filter{identifier.in}': includes}),
            ...(q && { 'filter{identifier.icontains}': q }),
            with_resources: "True"
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

export const getRegions = ({ q, includes, page, pageSize, config, ...params }, filterKey = 'regions') => {
    return axios.get(parseDevHostname(`${endpoints[REGIONS]}`), {
        ...config,
        params: {
            page_size: pageSize || 9999,
            page,
            ...params,
            ...(includes && {'filter{name.in}': includes}),
            ...(q && { 'filter{name.icontains}': q }),
            with_resources: "True"
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

export const getOwners = ({ q, includes, page, pageSize, config, ...params }, filterKey = 'owners') => {
    return axios.get(parseDevHostname(`${endpoints[OWNERS]}`), {
        ...config,
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

export const getKeywords = ({ q, includes, page, pageSize, config, ...params }, filterKey =  'keywords') => {
    return axios.get(parseDevHostname(`${endpoints[KEYWORDS]}`), {
        ...config,
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
    return axios({
        url: parseDevHostname(`${endpoints[RESOURCES]}/${pk}/permissions`),
        data: body,
        method: 'put'
    })
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

export const downloadResource = (resource) => {
    const url = resource.download_url || resource.href;
    return axios.get(url, {
        responseType: 'blob',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(({ data, headers }) => ({output: data, headers}));
};

export const getPendingUploads = () => {
    return axios.get(parseDevHostname(endpoints[UPLOADS]), {
        params: {
            'filter{-state}': 'PROCESSED',
            'page': 1,
            'page_size': 99999
        }
    })
        .then(({ data }) => data?.uploads);
};

export const getPendingExecutionRequests = () => {
    return axios.get(parseDevHostname(endpoints[EXECUTIONREQUEST]), {
        params: {
            'filter{action}': 'import',
            'filter{source}': 'upload',
            'page': 1,
            'page_size': 99999
        }
    })
        .then(({ data }) => data?.requests)
        .catch(() => null);
};

export const getProcessedUploadsById = (ids) => {
    return axios.get(parseDevHostname(endpoints[UPLOADS]), {
        params: {
            'filter{state}': 'PROCESSED',
            'page': 1,
            'page_size': ids.length,
            'filter{id.in}': ids
        }
    })
        .then(({ data }) => data?.uploads);
};

export const getProcessedUploadsByImportId = (importIds) => {
    return axios.get(parseDevHostname(endpoints[UPLOADS]), {
        params: {
            'filter{state}': 'PROCESSED',
            'page': 1,
            'page_size': importIds.length,
            'filter{import_id.in}': importIds
        }
    })
        .then(({ data }) => data?.uploads);
};

export const uploadDataset = ({
    file,
    auxiliaryFiles,
    ext,
    charset = 'UTF-8',
    config
}) => {
    const formData = new FormData();
    formData.append('base_file', file);
    formData.append('charset', charset);
    formData.append('store_spatial_files', true);
    const { timeEnabled } = getConfigProp('geoNodeSettings') || {};
    if (timeEnabled) {
        formData.append('time', ['csv', 'shp'].includes(ext) ? true : false);
    }
    Object.keys(auxiliaryFiles)
        .forEach((auxExt) => {
            formData.append(auxExt + '_file', auxiliaryFiles[auxExt]);
        });
    return axios.post(`${parseDevHostname(endpoints[UPLOADS])}/upload`, formData, config)
        .then(({ data }) => (data));
};

export const uploadDocument = ({
    title,
    file,
    config
}) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('doc_file', file);
    return axios.post(`/documents/upload?no__redirect=true`, formData, config)
        .then(({ data }) => (data));
};

export const getExecutionStatus = (executionId) => {
    return axios.get(`${parseDevHostname(endpoints[STATUS])}/${executionId}`)
        .then(({ data }) => ({...data, id: executionId, create_date: data.created }));
};

export const deleteExecutionRequest = (executionId) => {
    return axios.delete(`${parseDevHostname(endpoints[EXECUTIONREQUEST])}/${executionId}`);
};

export const getResourceByTypeAndByPk = (type, pk) => {
    switch (type) {
    case "document":
        return getDocumentByPk(pk);
    case "dataset":
        return getDatasetByPk(pk);
    // Add type condition based on requirement
    default:
        return getResourceByPk(pk);
    }
};

export const getFacetItemsByFacetName = ({ name: facetName, style, filterKey }, { config, ...params }) => {
    return axios.get(`${parseDevHostname(endpoints[FACETS])}/${facetName}`, { ...config, params }).then(({data}) => {
        const {page: _page = 0, items = [], total, page_size: size} = data?.topics ?? {};
        const page = Number(_page);
        const isNextPageAvailable = (Math.ceil(Number(total) / Number(size)) - (page + 1)) !== 0;
        return {
            page,
            isNextPageAvailable,
            items: items.map(({label, is_localized: isLocalized, key, count} = {})=> {
                const item = {
                    type: "filter",
                    ...(isLocalized ? { label } : { labelId: label }),
                    count,
                    filterKey,
                    filterValue: String(key),
                    style
                };
                setFilterById(filterKey + key, item);
                return item;
            })
        };
    });
};

export const getFacetItems = () => {
    return axios
        .get(parseDevHostname(endpoints[FACETS]))
        .then(({ data } = {}) =>
            data?.facets?.map((facet) => ({
                ...facet,
                loadItems: getFacetItemsByFacetName
            })) || []
        ).catch(() => []);
};

export default {
    getEndpoints,
    getResources,
    getResourceByPk,
    getLinkedResourcesByPk,
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
    getDocumentsByPk,
    createMap,
    updateMap,
    getMapByPk,
    getMapsByPk,
    getCategories,
    getRegions,
    getOwners,
    getKeywords,
    getCompactPermissionsByPk,
    updateCompactPermissionsByPk,
    deleteResource,
    copyResource,
    downloadResource,
    getDatasets,
    getPendingUploads,
    getPendingExecutionRequests,
    getProcessedUploadsById,
    getProcessedUploadsByImportId,
    uploadDocument,
    getExecutionStatus,
    deleteExecutionRequest,
    getResourceByTypeAndByPk,
    getFacetItems,
    getFacetItemsByFacetName
};
