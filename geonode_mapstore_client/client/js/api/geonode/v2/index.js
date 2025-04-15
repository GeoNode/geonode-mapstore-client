/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import {
    getApiToken,
    paramsSerializer,
    getGeoNodeConfig,
    getGeoNodeLocalConfig,
    API_PRESET
} from '@js/utils/APIUtils';
import merge from 'lodash/merge';
import mergeWith from 'lodash/mergeWith';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import castArray from 'lodash/castArray';
import get from 'lodash/get';
import { getUserInfo } from '@js/api/geonode/user';
import { ResourceTypes, availableResourceTypes, setAvailableResourceTypes, getDownloadUrlInfo, isDefaultDatasetSubtype } from '@js/utils/ResourceUtils';
import { mergeConfigsPatch } from '@mapstore/patcher';
import {
    RESOURCES,
    DOCUMENTS,
    DATASETS,
    MAPS,
    GEOAPPS,
    USERS,
    RESOURCE_TYPES,
    GROUPS,
    EXECUTION_REQUEST,
    getEndpoints as cGetEndpoints,
    getEndpointUrl,
    getQueryParams
} from './constants';


export const getEndpoints = cGetEndpoints;

/**
 * Actions for GeoNode save workflow
 * @module api/geonode/v2
 */

export const getResources = ({
    q,
    pageSize = 20,
    page = 1,
    sort,
    f,
    customFilters = [],
    config,
    ...params
}) => {
    const _params = {
        ...getQueryParams({...params, f}, customFilters),
        ...(q && {
            search: q,
            search_fields: ['title', 'abstract']
        }),
        ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
        page,
        page_size: pageSize,
        'filter{metadata_only}': false, // exclude resources such as services
        api_preset: API_PRESET.CATALOGS
    };
    return axios.get(getEndpointUrl(RESOURCES), {
        params: _params,
        ...config,
        ...paramsSerializer()
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
            getEndpointUrl(MAPS), {
                // axios will format query params array to `key[]=value1&key[]=value2`
                params: {
                    ...params,
                    ...(q && {
                        search: q,
                        search_fields: ['title', 'abstract']
                    }),
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    page,
                    page_size: pageSize,
                    api_preset: API_PRESET.MAPS
                },
                ...paramsSerializer()
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
    sort
}) => {
    return axios
        .get(
            getEndpointUrl(RESOURCES), {
                // axios will format query params array to `key[]=value1&key[]=value2`
                params: {
                    'filter{resource_type.in}': 'dataset',
                    'filter{metadata_only}': false,
                    ...(q && {
                        search: q,
                        search_fields: ['title', 'abstract']
                    }),
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    page,
                    page_size: pageSize,
                    api_preset: API_PRESET.CATALOGS
                },
                ...paramsSerializer()
            })
        .then(({ data }) => {
            return {
                totalCount: data.total,
                isNextPageAvailable: !!data.links.next,
                resources: (data.resources || [])
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
            getEndpointUrl(DOCUMENTS), {
                params: {
                    ...params,
                    ...(q && {
                        search: q,
                        search_fields: ['title', 'abstract']
                    }),
                    ...(sort && { sort: isArray(sort) ? sort : [ sort ]}),
                    'filter{subtype}': [docType],
                    page,
                    page_size: pageSize,
                    api_preset: API_PRESET.DOCUMENTS
                },
                ...paramsSerializer()
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
    return axios.post(getEndpointUrl(RESOURCES, `/${pk}/set_thumbnail_from_bbox`), body)
        .then(({ data }) => (data));
};

export const setResourceThumbnail = (pk, body) => {
    return axios.put(getEndpointUrl(RESOURCES, `/${pk}/set_thumbnail`), body)
        .then(({ data }) => data);
};

export const setFavoriteResource = (pk, favorite) => {
    const request = favorite ? axios.post : axios.delete;
    return request(getEndpointUrl(RESOURCES, `/${pk}/favorite`))
        .then(({ data }) => data );
};

export const getResourceByPk = (pk) => {
    return axios.get(getEndpointUrl(RESOURCES, `/${pk}`), {
        params: {
            api_preset: API_PRESET.VIEWER_COMMON
        }
    })
        .then(({ data }) => data.resource);
};

export const getLinkedResourcesByPk = (pk) => {
    return axios.get(getEndpointUrl(RESOURCES, `/${pk}/linked_resources`), {
        params: {
            'page': 1,
            'page_size': 99999
        }
    })
        .then(({ data }) => data ?? {});
};

export const setLinkedResourcesByPk = (sourcePk, targetPks) => {
    return axios.post(getEndpointUrl(RESOURCES, `/${sourcePk}/linked_resources`),
        {
            target: castArray(targetPks)
        }
    )
        .then(({ data }) => data ?? {});
};

export const removeLinkedResourcesByPk = (sourcePk, targetPks) => {
    return axios.delete(getEndpointUrl(RESOURCES, `/${sourcePk}/linked_resources`), {
        data: {
            target: castArray(targetPks)
        }
    })
        .then(({ data }) => data ?? {});
};

export const getResourceByUuid = (uuid) => {
    return axios.get(getEndpointUrl(RESOURCES), {
        params: {
            'filter{uuid}': uuid,
            api_preset: API_PRESET.VIEWER_COMMON
        }
    })
        .then(({ data }) => data?.resources?.[0]);
};

export const getDatasetByPk = (pk) => {
    return axios.get(getEndpointUrl(DATASETS, `/${pk}`), {
        params: {
            api_preset: [API_PRESET.VIEWER_COMMON, API_PRESET.DATASET]
        },
        ...paramsSerializer()
    })
        .then(({ data }) => data.dataset);
};

export const getDatasetTimeSettingsByPk = (pk) => {
    return axios.get(getEndpointUrl(DATASETS, `/${pk}/timeseries`))
        .then(({ data }) => data).catch(() => {});
};

export const getDocumentByPk = (pk) => {
    return axios.get(getEndpointUrl(DOCUMENTS, `/${pk}`), {
        params: {
            api_preset: [API_PRESET.VIEWER_COMMON, API_PRESET.DOCUMENT]
        },
        ...paramsSerializer()
    })
        .then(({ data }) => data.document);
};

export const getDocumentsByPk = (pk) => {
    const pks = castArray(pk);
    return axios.get(getEndpointUrl(DOCUMENTS), {
        params: {
            'filter{pk.in}': pks,
            page_size: pks.length,
            api_preset: [API_PRESET.VIEWER_COMMON, API_PRESET.DOCUMENT]
        },
        ...paramsSerializer()
    })
        .then(({ data }) => data.documents);
};

export const createGeoApp = (body) => {
    return axios.post(getEndpointUrl(GEOAPPS), body, {
        params: {
            include: ['data']
        }
    })
        .then(({ data }) => data.geoapp);
};

export const getGeoAppByPk = (pk, params) => {
    return axios.get(getEndpointUrl(GEOAPPS, `/${pk}`), {
        params: {
            full: true,
            api_preset: API_PRESET.VIEWER_COMMON,
            include: ['data'],
            ...params
        }
    })
        .then(({ data }) => data.geoapp);
};

export const getGeoApps = ({
    q,
    pageSize = 20,
    page = 1,
    sort,
    ...params
}) => {
    return axios
        .get(
            getEndpointUrl(GEOAPPS), {
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
                ...paramsSerializer()
            })
        .then(({ data }) => {
            return {
                totalCount: data.total,
                isNextPageAvailable: !!data.links.next,
                resources: (data.geoapps || [])
                    .map((resource) => {
                        return resource;
                    })
            };
        });
};

export const updateGeoApp = (pk, body) => {
    return axios.patch(getEndpointUrl(GEOAPPS, `/${pk}`), body, body?.data ? {
        params: {
            include: ['data']
        }
    } : {})
        .then(({ data }) => data.geoapp);
};

export const updateDatasetTimeSeries = (pk, body) => {
    return axios.put(getEndpointUrl(DATASETS, `/${pk}/timeseries`), body)
        .then(({ data }) => data);
};

export const updateDataset = (pk, body) => {
    return axios.patch(getEndpointUrl(DATASETS, `/${pk}`), body)
        .then(({ data }) => (data.dataset));
};

export const updateDocument = (pk, body) => {
    return axios.patch(getEndpointUrl(DOCUMENTS, `/${pk}`), body)
        .then(({ data }) => data.document);
};

export const getUsers = ({
    q,
    page = 1,
    pageSize = 20,
    config,
    ...params
} = {}) => {
    return axios.get(
        getEndpointUrl(USERS),
        {
            ...config,
            params: {
                ...params,
                ...(q && {
                    search: q,
                    search_fields: ['username', 'first_name', 'last_name']
                }),
                page,
                page_size: pageSize
            },
            ...paramsSerializer()
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
    config,
    ...params
} = {}) => {
    return axios.get(
        getEndpointUrl(GROUPS),
        {
            ...config,
            params: {
                ...params,
                ...(q && {
                    search: q,
                    search_fields: ['title', 'slug']
                }),
                page,
                page_size: pageSize
            },
            ...paramsSerializer()
        })
        .then(({ data }) => {
            return {
                total: data.total,
                isNextPageAvailable: !!data.links.next,
                groups: data.group_profiles
            };
        });
};

export const transferResource = (pk, body) => {
    return axios.post(getEndpointUrl(USERS, `/${pk}/transfer_resources`), body)
        .then(({ data }) => (data));
};

export const getUserByPk = (pk, apikey) => {
    return axios.get(getEndpointUrl(USERS, `/${pk}`), {
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

export const getConfiguration = (configUrl = getGeoNodeLocalConfig('geoNodeSettings.staticPath', '/static/') + 'mapstore/configs/localConfig.json') => {
    return axios.get(configUrl)
        .then(({ data }) => {
            const geoNodePageConfig = getGeoNodeConfig();
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
    return axios.get(getEndpointUrl(RESOURCE_TYPES))
        .then(({ data }) => {
            setAvailableResourceTypes(data?.resource_types || []);
            return [...availableResourceTypes];
        });
};

export const getDatasetByName = name => {
    const url = getEndpointUrl(DATASETS, `/?filter{alternate}=${name}`);
    return axios.get(url, {
        params: {
            exclude: ['*'],
            include: ['pk', 'perms', 'alternate']
        }
    })
        .then(({data}) => data?.datasets[0]);
};

export const getDatasetsByName = names => {
    const url = getEndpointUrl(DATASETS);
    return axios.get(url, {
        params: {
            page_size: names.length,
            'filter{alternate.in}': names,
            exclude: ['*'],
            include: ['pk', 'perms', 'alternate']
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
    return axios.post(getEndpointUrl(MAPS), body)
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
    return axios.patch(getEndpointUrl(MAPS, `/${id}/`),
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
* @param {number|string} pk resource id
* @param {string[]} includes property to be included in the response
* @return {promise} it returns an object with the success map object response
*/
export const getMapByPk = (pk) => {
    return axios.get(getEndpointUrl(MAPS, `/${pk}/`),
        {
            params: {
                api_preset: [API_PRESET.VIEWER_COMMON, API_PRESET.MAP]
            },
            ...paramsSerializer()
        })
        .then(({ data }) => data?.map);
};

export const getMapsByPk = (pk) => {
    const pks = castArray(pk);
    return axios.get(getEndpointUrl(MAPS),
        {
            params: {
                'filter{pk.in}': pks,
                page_size: pks.length,
                api_preset: API_PRESET.MAPS
            },
            ...paramsSerializer()
        })
        .then(({ data }) => data?.maps);
};

export const getFeaturedResources = (page = 1, page_size =  4) => {
    return axios.get(getEndpointUrl(RESOURCES), {
        params: {
            page_size,
            page,
            'filter{featured}': true,
            api_preset: API_PRESET.CATALOGS
        }
    }).then(({data}) => data);
};

export const getCompactPermissionsByPk = (pk) => {
    return axios.get(getEndpointUrl(RESOURCES, `/${pk}/permissions`))
        .then(({ data }) => data);
};

export const updateCompactPermissionsByPk = (pk, body) => {
    return axios({
        url: getEndpointUrl(RESOURCES, `/${pk}/permissions`),
        data: body,
        method: 'put'
    })
        .then(({ data }) => data);
};

export const deleteResource = (resource) => {
    return axios.delete(getEndpointUrl(RESOURCES, `/${resource.pk}/delete`))
        .then(({ data }) => data);
};

export const copyResource = (resource) => {
    const defaults = {
        title: resource.title,
        ...(resource.data && { data: resource.data })
    };
    return axios.put(getEndpointUrl(RESOURCES, `/${resource.pk}/copy`), 'defaults=' + JSON.stringify(defaults))
        .then(({ data }) => data);
};

export const downloadResource = (resource) => {
    const { url, ajaxSafe } = getDownloadUrlInfo(resource);
    if (!ajaxSafe) {
        window.open(url, '_blank');
        return Promise.reject(new Error("Not ajax safe"));
    }
    return axios.get(url, {
        responseType: 'blob',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(({ data, headers }) => ({output: data, headers}));
};

export const deleteExecutionRequest = (executionId) => {
    return axios.delete(getEndpointUrl(EXECUTION_REQUEST, `/${executionId}`));
};

export const getResourceByTypeAndByPk = (type, pk, subtype) => {
    switch (type) {
    case "document":
        return getDocumentByPk(pk);
    case "dataset":
        return isDefaultDatasetSubtype(subtype)
            ? getDatasetByPk(pk)
            : getResourceByPk(pk);
    // Add type condition based on requirement
    case "map":
        return axios.get(getEndpointUrl(MAPS, `/${pk}/`),
            {
                params: {
                    api_preset: [API_PRESET.VIEWER_COMMON, API_PRESET.MAP_DETAILS]
                },
                ...paramsSerializer()
            })
            .then(({ data }) => data?.map);
    default:
        return getResourceByPk(pk);
    }
};

export default {
    getEndpoints,
    getResources,
    getResourceByPk,
    getLinkedResourcesByPk,
    setLinkedResourcesByPk,
    removeLinkedResourcesByPk,
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
    getCompactPermissionsByPk,
    updateCompactPermissionsByPk,
    deleteResource,
    copyResource,
    downloadResource,
    getDatasets,
    deleteExecutionRequest,
    getResourceByTypeAndByPk
};
