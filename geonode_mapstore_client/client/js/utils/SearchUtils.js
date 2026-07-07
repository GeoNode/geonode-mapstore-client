/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import castArray from 'lodash/castArray';
import omit from 'lodash/omit';
import { v4 as uuid } from 'uuid';

export const hashLocationToHref = ({
    location,
    pathname,
    query,
    replaceQuery,
    excludeQueryKeys
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
        query: omit(Object.keys(newQuery).reduce((acc, newQueryKey) =>
            !newQuery[newQueryKey] || newQuery[newQueryKey].length === 0
                ? acc
                : { ...acc,  [newQueryKey]: newQuery[newQueryKey]}, {}), excludeQueryKeys)
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
    const queryFilters = Object.keys(query).reduce((acc, key) => ['sort', 'page', 'd'].includes(key)
        ? acc
        : [...acc, ...castArray(query[key]).map((value) => ({ key, value }))], []);
    return queryFilters;
}

export const filterFormItemsContainFacet = (formItems) => {
    return formItems.some(formItem => formItem.items ? filterFormItemsContainFacet(formItem.items) : !!formItem.facet);
};

export const updateFilterFormItemsWithFacet = ({formItems, facetItems}) => {
    return formItems.reduce((acc, formItem) => {
        if (!!formItem.facet) {
            const filteredFacetItems = (facetItems || [])
                .filter(f => f.type === formItem.facet)
                .filter(f => formItem.include ? formItem.include?.includes(f.name) : formItem.exclude ? !formItem.exclude?.includes(f.name) : true)
                .sort((a, b) => a.order - b.order);
            return [
                ...acc,
                ...filteredFacetItems
                    .map(({ name, config, filter: filterKey, label, is_localized: isLocalized, loadItems } = {}) => {
                        const style = config.style || formItem.style;
                        const type = config.type || formItem.type;
                        return {
                            uuid: uuid(),
                            name,
                            key: filterKey,
                            id: name,
                            type,
                            style,
                            ...(isLocalized ? { labelId: label } : { label }),
                            loadItems: (params, filters, setFilters) => loadItems({ name, style, filterKey, filters, setFilters }, params)
                        };
                    })
            ];
        }
        if (formItem?.items) {
            return [
                ...acc,
                {
                    ...formItem,
                    uuid: formItem.uuid || uuid(),
                    items: updateFilterFormItemsWithFacet({formItems: formItem.items, facetItems})
                }
            ];
        }
        return [
            ...acc,
            {
                ...formItem,
                uuid: formItem.uuid || uuid()
            }
        ];
    }, []);
};

/**
 * Parse icon name from item.
 * Skip font awesome prefix from prop `fa-${icon}` and pick only icon name
 * @param {Object} item filter items
 * @returns {string} icon name
 */
//
export const parseIcon = (item) => {
    let value;
    if (typeof item === 'object') {
        value = item.icon ?? item?.fa_class;
    } else {
        value = item;
    }
    return value?.replace("fa-", "");
};

export default {
    hashLocationToHref,
    getUserName,
    clearQueryParams,
    getQueryFilters,
    filterFormItemsContainFacet,
    updateFilterFormItemsWithFacet,
    parseIcon
};
