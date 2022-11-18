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

export function clearQueryParams(location) {
    const { query } = url.parse(location.search, true);
    const newParams = Object.keys(query)
        .reduce((acc, key) =>
            key.indexOf('filter') === 0
            || key === 'f'
            || key === 'q'
                ? {
                    ...acc,
                    [key]: []
                }
                : acc, { extent: undefined });
    return newParams;
}

export function getQueryFilters(query) {
    const queryFilters = Object.keys(query).reduce((acc, key) => key.indexOf('sort') === 0
        ? acc
        : [...acc, ...castArray(query[key]).map((value) => ({ key, value }))], []);
    return queryFilters;
}

export let parentFilters = []; // parent filters to be imported into FilterItems.jsx
/**
 * A setter funtion to assign a value to parentFilters
 * @param {*} customFilters filters to be assigned to parentFilters
 */
export const setCustomParentFilters = (customFilters) => {
    parentFilters = customFilters;
};

// sets sub-filters and includes parent to allow OR operation on bakend
export function setChildFilters(customFilters, item) {
    const updatedFilters = [...customFilters, item.id, ...(!customFilters.includes(item.parentId) ? [item.parentId] : [])];
    const newParentFilters = parentFilters.includes(item.parentId) ? parentFilters : [...parentFilters, item.parentId];
    setCustomParentFilters(newParentFilters);
    return updatedFilters;
}

export function setActiveChildFilters(customFilters, item) {
    const updatedFilters = customFilters.filter(value => value !== item.id);
    const newParentFilters = parentFilters.includes(item.parentId) ? parentFilters : [...parentFilters, item.parentId];
    setCustomParentFilters(newParentFilters);
    return updatedFilters;
}


export default {
    getQueryKeys,
    getPageSize,
    hashLocationToHref,
    getUserName,
    clearQueryParams,
    getQueryFilters,
    setChildFilters,
    setCustomParentFilters
};
