/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import axios from '@mapstore/framework/libs/ajax';
import {
    parseDevHostname,
    getApiToken,
    getGeoNodeLocalConfig
} from '@js/utils/APIUtils';
import mergeWith from 'lodash/mergeWith';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import castArray from 'lodash/castArray';
import omit from 'lodash/omit';

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
    'executionrequest': '/api/v2/executionrequest',
    'facets': '/api/v2/facets',
    'uploads': '/api/v2/uploads',
    'metadata': '/api/v2/metadata'
};

export const RESOURCES = 'resources';
export const DOCUMENTS = 'documents';
export const DATASETS = 'datasets';
export const MAPS = 'maps';
export const GEOAPPS = 'geoapps';
export const USERS = 'users';
export const RESOURCE_TYPES = 'resource_types';
export const GROUPS = 'groups';
export const EXECUTION_REQUEST = 'executionrequest';
export const FACETS = 'facets';
export const UPLOADS = 'uploads';
export const METADATA = 'metadata';

export const setEndpoints = (data) => {
    endpoints = { ...endpoints, ...data };
};

export const getEndpointUrl = (id, parts) => {
    return parseDevHostname(parts ? `${endpoints[id]}${parts}` : endpoints[id]);
};

/**
 * get all thw endpoints available from API V2
 */
export const getEndpoints = () => {
    const apikey = getApiToken();
    const endpointV2 = getGeoNodeLocalConfig('geoNodeApi.endpointV2', '/api/v2/');
    return axios.get(parseDevHostname(endpointV2), {
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
export const getQueryParams = (params, customFilters) => {
    const customQuery = customFilters
        .filter(({ id }) => castArray(params?.f ?? []).indexOf(id) !== -1)
        .reduce((acc, filter) => mergeCustomQuery(acc, filter.query || {}), {}) || {};
    return {
        ...mergeCustomQuery(omit(params, "f"), customQuery)
    };
};

