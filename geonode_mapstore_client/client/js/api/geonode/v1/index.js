/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import cookies from 'js-cookie';
import { setFilterById } from '@js/utils/GNSearchUtils';


function addCountToLabel(name, count) {
    return `${name} (${count || 0})`;
}

/**
* Api for GeoNode v1
* @name api.geonode.v1
*/

/**
* Get resource by primary key
* @memberof api.geonode.v1
* @param {number|string} pk primary key
* @return {promise} it returns an object with requested resource
*/
export const getResourceByPk = (pk) => {
    const { endpointV1 = '/api' } = getConfigProp('geoNodeApi') || {};
    return axios.get(`${endpointV1}/base/${pk}`)
        // add pk as alias to id
        // used in save and save as for map
        .then(({ data }) => ({ pk: data.id, ...data }));
};

export const autocomplete = (params) => {
    const { endpointAutocomplete = '/base/autocomplete_response' } = getConfigProp('geoNodeApi') || {};
    return axios.get(endpointAutocomplete, { params })
        .then(({ data }) => {
            return {
                suggestions: (data?.results || [])
                    .map(({ id, text }) => {
                        return {
                            id,
                            label: text,
                            value: text
                        };
                    })
            };
        });
};

export const getUserInfo = () => {
    const { endpointV1 = '/api' } = getConfigProp('geoNodeApi') || {};
    return axios.get(`${endpointV1}/o/v4/userinfo`)
        .then(({ data }) => data);
};

export const getCategories = ({ q, idIn, ...params }, filterKey = 'categories') => {
    const { endpointV1 = '/api' } = getConfigProp('geoNodeApi') || {};
    const queryIn = idIn
        ? idIn.reduce((query, value, idx) => query + (idx === 0 ? '?' : '&') + 'identifier__in=' + value, '')
        : '';
    return axios.get(`${endpointV1}/categories${queryIn}`, {
        params: {
            limit: 9999,
            ...params,
            ...(q && { identifier__icontains: q })
        }
    })
        .then(({ data }) => {
            const results = (data?.objects || [])
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

export const getKeywords = ({ q, idIn, ...params }, filterKey =  'keywords') => {
    const { endpointV1 = '/api' } = getConfigProp('geoNodeApi') || {};
    const queryIn = idIn
        ? idIn.reduce((query, value, idx) => query + (idx === 0 ? '?' : '&') + 'slug__in=' + value, '')
        : '';
    return axios.get(`${endpointV1}/keywords${queryIn}`, {
        params: {
            limit: 9999,
            ...params,
            ...(q && { slug__icontains: q })
        }
    })
        .then(({ data }) => {
            const results = (data?.objects || [])
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

export const getRegions = ({ q, idIn, ...params }, filterKey = 'regions') => {
    const { endpointV1 = '/api' } = getConfigProp('geoNodeApi') || {};
    const queryIn = idIn
        ? idIn.reduce((query, value, idx) => query + (idx === 0 ? '?' : '&') + 'name__in=' + value, '')
        : '';
    return axios.get(`${endpointV1}/regions${queryIn}`, {
        params: {
            limit: 9999,
            ...params,
            ...(q && { name__icontains: q })
        }
    })
        .then(({ data }) => {
            const results = (data?.objects || [])
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
    const { endpointV1 = '/api' } = getConfigProp('geoNodeApi') || {};
    const queryIn = idIn
        ? idIn.reduce((query, value, idx) => query + (idx === 0 ? '?' : '&') + 'username__in=' + value, '')
        : '';
    return axios.get(`${endpointV1}/owners${queryIn}`, {
        params: {
            limit: 9999,
            ...params,
            ...(q && { username__icontains: q })
        }
    })
        .then(({ data }) => {
            const results = (data?.objects || [])
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

export const setLanguage = (languageCode) => {
    const csrfMiddlewareToken = cookies.get('csrftoken');
    return axios.post('/i18n/setlang/', `csrfmiddlewaretoken=${csrfMiddlewareToken}&language=${languageCode}`, {
        params: {
            next: '/static/mapstore/configs/placeholder.json'
        }
    });
};

export default {
    getResourceByPk,
    getCategories,
    getKeywords,
    getRegions,
    getOwners,
    setLanguage
};
