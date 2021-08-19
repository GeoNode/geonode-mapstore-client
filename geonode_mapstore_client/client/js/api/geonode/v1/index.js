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
    setLanguage
};
