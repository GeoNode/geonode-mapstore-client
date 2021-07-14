/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import castArray from 'lodash/castArray';

let defaultQueryKeys = [
    'page'
];

let defaultPageSize = 20;

let filters = {};

export const setFilterById = (id, value) => {
    filters[id] = value;
};
export const getFilterLabelById = (filterKey = '', id) => filters?.[filterKey + id]?.selectOption?.label;
export const getFilterById = (filterKey = '', id) => filters?.[filterKey + id];

export const getQueryKeys = () => defaultQueryKeys;
export const getPageSize = () => defaultPageSize;

export const hashLocationToHref = ({
    location,
    pathname,
    query,
    replaceQuery
}) => {
    const { search, ...loc } = location;
    const { query: locationQuery } = url.parse(search || '', true);

    const newQuery = query
        ? replaceQuery
            ? { ...locationQuery, ...query }
            : Object.keys(query).reduce((acc, key) => {
                const value = query[key];
                const currentQueryValues = castArray(acc[key]).filter(val => val);
                const queryValue = currentQueryValues.indexOf(value) === -1
                    ? [...currentQueryValues, value]
                    : currentQueryValues.filter(val => val !== value);
                return { ...acc, [key]: queryValue };
            }, locationQuery)
        : locationQuery;

    return `#${url.format({
        ...loc,
        ...(pathname && { pathname }),
        query: Object.keys(newQuery).reduce((acc, newQueryKey) =>
            !newQuery[newQueryKey] || newQuery[newQueryKey].length === 0
                ? acc
                : { ...acc,  [newQueryKey]: newQuery[newQueryKey]}, {})
    })}`;
};

export function getUserName(user) {
    if (user.first_name && user.last_name) {
        return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
}

function updateUrlQueryParameter(requestUrl, query) {
    const parsedUrl = url.parse(requestUrl, true);
    return url.format({
        ...parsedUrl,
        query: {
            ...parsedUrl.query,
            ...query
        }
    });
}

export const getResourceTypesInfo = () => ({
    'layer': {
        icon: 'layer-group',
        formatEmbedUrl: (resource) => updateUrlQueryParameter(resource.embed_url, {
            config: 'layer_preview',
            theme: 'preview'
        }),
        formatDetailUrl: (resource) => (`/catalogue/#/layer/${resource.pk}`),
        name: 'Layer'
    },
    'map': {
        icon: 'map-marked',
        formatEmbedUrl: (resource) => updateUrlQueryParameter(resource.embed_url, {
            config: 'map_preview',
            theme: 'preview'
        }),
        formatDetailUrl: (resource) => (`/catalogue/#/map/${resource.pk}`),
        name: 'Map'
    },
    'document': {
        icon: 'file',
        name: 'Document',
        formatDetailUrl: (resource) => (`/catalogue/#/document/${resource.pk}`)
    },
    'geostory': {
        icon: 'book-open',
        name: 'GeoStory',
        formatDetailUrl: (resource) => (`/catalogue/#/geostory/${resource.pk}`)
    },
    'image': {
        icon: 'file-image',
        name: 'Image',
        formatDetailUrl: (resource) => (`/catalogue/#/document/${resource.pk}`)
    },
    'video': {
        icon: 'file-video',
        name: 'Video',
        formatDetailUrl: (resource) => (`/catalogue/#/document/${resource.pk}`)
    }
});

export default {
    getQueryKeys,
    getPageSize,
    hashLocationToHref,
    getUserName,
    getResourceTypesInfo
};
