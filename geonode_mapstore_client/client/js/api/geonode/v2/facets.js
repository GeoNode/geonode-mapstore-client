/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { castArray, isEmpty } from 'lodash';
import axios from '@mapstore/framework/libs/ajax';
import {
    paramsSerializer
} from '@js/utils/APIUtils';
import {
    FACETS,
    getEndpointUrl,
    getQueryParams
} from './constants';
import { parseIcon } from '@js/utils/SearchUtils';
import { addFilters, getFilterByField } from '@mapstore/framework/utils/ResourcesFiltersUtils';
import { getCustomMenuFilters } from '@js/selectors/config';

const parseTopicsItems = (items, { facet, style }) => {
    return items.map((item) => {
        const value = String(item.key);
        return {
            type: "filter",
            // TODO remove when api send isLocalized for all facets response
            ...(item.is_localized ? { labelId: item.label } : { label: item.label }),
            count: item.count,
            filterKey: facet.filter,
            filterValue: value,
            value,
            style,
            icon: parseIcon(item.fa_class),
            image: item.image
        };
    });
};

const applyFacetToFields = (fields, facets = [], { customFilters }) => {
    return fields.map((field) => {
        if (field.facet) {
            const filteredFacetsByType = facets
                .filter(f => f.type === field.facet)
                .filter(f => field.include
                    ? field.include?.includes(f.name)
                    : field.exclude
                        ? !field.exclude?.includes(f.name)
                        : true);
            if (!filteredFacetsByType.length) {
                return null;
            }

            return filteredFacetsByType.map((facet) => {
                const facetConfig = facet.config || {};
                const style = facetConfig.style || field.style;
                const type = facetConfig.type || field.type;
                const order = facetConfig.order || field.order;
                const isLocalized = !!facet.is_localized;
                const label = facet.label;
                return {
                    id: facet.name,
                    type,
                    style,
                    order,
                    facet: field.facet,
                    ...(isLocalized ? { labelId: label } : { label }),
                    key: facet.filter,
                    loadItems: ({ params, config }) => {
                        const { q, ...updatedParams } = getQueryParams(params, customFilters);
                        return axios.get(getEndpointUrl(FACETS, `/${facet.name}`), {
                            ...config,
                            params: {
                                ...(q && { topic_contains: q }),
                                ...updatedParams
                            },
                            ...paramsSerializer()
                        })
                            .then(({ data }) => {
                                const topics = data?.topics ?? {};
                                const pageSize = topics?.page_size;
                                const page = Number(topics.page);
                                const total = topics?.total;
                                const isNextPageAvailable = (Math.ceil(Number(total) / Number(pageSize)) - (page + 1)) !== 0;
                                const items = parseTopicsItems(topics.items, { facet, style });

                                const filterField = { key: facet.filter };
                                // if the items are empty and items are selected
                                // we should still see them with count equal 0
                                // to allow user to deselect the filter
                                // TODO: review if possible to move this control in accordion
                                const facetQuery = updatedParams[facet.filter];
                                if (!isEmpty(facetQuery) && items.length === 0) {

                                    const appliedFilters = castArray(facetQuery)
                                        .map((val) => getFilterByField(filterField, val))
                                        .map(appliedFilter => ({ ...appliedFilter, count: 0 }));
                                    // store all filters information
                                    addFilters(filterField, appliedFilters);

                                    return {
                                        isNextPageAvailable,
                                        items: appliedFilters
                                    };
                                }

                                // store all filters information
                                addFilters(filterField, items);

                                return {
                                    isNextPageAvailable,
                                    items
                                };
                            });
                    }
                };
            });
        }
        if (field.items) {
            return {
                ...field,
                items: applyFacetToFields(field.items, facets, { customFilters })
            };
        }
        return field;
    }).flat().filter(val => val).sort((a, b) => a.order - b.order);
};

let facetsCache;

const findFacetField = (facet, fields) => {
    return fields.filter((field) => field.facet && field.id === facet.name
        ? true
        : field.items
            ? findFacetField(facet, field.items)
            : false).flat()[0];
};

const updateFacets = (fields, facets = [], query = {}) => {
    const queryFacets = facets.filter(facet => query[facet.filter]);
    if (queryFacets.length) {
        return axios.all(queryFacets.map((queryFacet) => {
            const field = findFacetField(queryFacet, fields);
            if (!field) {
                return Promise.resolve({});
            }
            const keys = castArray(query[queryFacet.filter]);
            const style = queryFacet?.config?.style || field.style;
            return keys.map((key) => {
                const { q, ...params } = query;
                return axios.get(getEndpointUrl(FACETS, `/${queryFacet.name}`), {
                    params: {
                        ...params,
                        ...(q && { topic_contains: q }),
                        include_topics: true,
                        key
                    },
                    ...paramsSerializer()
                })
                    .then(({ data } = {}) => {
                        const filterField = { key: queryFacet.filter };
                        const topics = data?.topics ?? {};
                        const items = parseTopicsItems(topics.items, { facet: queryFacet, style });
                        // store all filters information
                        addFilters(filterField, items);
                        return {};
                    })
                    .catch(() => ({}));
            });
        }).flat());
    }
    return Promise.resolve({});
};

export const getFacetItems = ({
    fields,
    query,
    monitoredState
}) => {
    const customFilters = getCustomMenuFilters(monitoredState);
    const updatedParams = getQueryParams(query, customFilters);
    return (
        !facetsCache
            ? axios.get(getEndpointUrl(FACETS), { params: { include_config: true }})
                .then(({ data } = {}) => {
                    facetsCache = data?.facets;
                    return { fields: applyFacetToFields(fields, facetsCache, { customFilters }) };
                })
                .catch(() => ({ fields: applyFacetToFields(fields, [], { customFilters }) }))
            : Promise.resolve({ fields: applyFacetToFields(fields, facetsCache, { customFilters }) })
    ).then((payload) => {
        // update information of the current selected facet filters
        return updateFacets(payload.fields, facetsCache, updatedParams).then(() => payload);
    });
};
