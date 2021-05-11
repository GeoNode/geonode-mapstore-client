/**
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import isEqual from 'lodash/isEqual';
import isArray from 'lodash/isArray';
import isNil from 'lodash/isNil';
import {
    autocomplete
} from '@js/api/geonode/v1';
import {
    getResources,
    getResourceByPk
} from '@js/api/geonode/v2';
import {
    FETCH_SUGGESTIONS,
    updateSuggestions,
    loadingSuggestions,
    SEARCH_RESOURCES,
    REQUEST_RESOURCE,
    updateResources,
    loadingResources,
    updateResourcesMetadata
} from '@js/actions/gnsearch';
import {
    resourceLoading,
    setResource,
    resourceError
} from '@js/actions/gnresource';
import {
    LOCATION_CHANGE,
    push
} from 'connected-react-router';
import {
    getQueryKeys,
    getPageSize
} from '@js/utils/GNSearchUtils';
import url from 'url';
import { getCustomMenuFilters } from '@js/selectors/config';

const UPDATE_RESOURCES_REQUEST = 'GEONODE_SEARCH:UPDATE_RESOURCES_REQUEST';
const updateResourcesRequest = (payload) => ({
    type: UPDATE_RESOURCES_REQUEST,
    payload
});

const cleanParams = (params) => {
    return Object.keys(params)
        .reduce((acc, key) =>
            (!params[key] || params[key].length === 0)
                ? acc : { ...acc, [key]: isArray(params[key])
                    ? params[key].map(value => value + '')
                    : params[key] + ''
                }, {});
};

const getParams = (locationSearch = '', params, defaultPage = 1) => {
    const { query: locationQuery } = url.parse(locationSearch || '', true);
    const { page: qPage, ...query } = locationQuery;
    const { page, ...mergedParams } = cleanParams({ ...params, ...query });
    return [
        mergedParams,
        page ? parseFloat(page) : defaultPage
    ];
};

export const gnsFetchSuggestionsEpic = (action$) =>
    action$.ofType(FETCH_SUGGESTIONS)
        .debounceTime(300)
        .switchMap(({ text }) => {
            return Observable
                .defer(() => autocomplete({ q: text }))
                .switchMap(({ suggestions }) => {
                    return Observable.of(
                        updateSuggestions(suggestions),
                        loadingSuggestions(false)
                    );
                })
                .startWith(loadingSuggestions(true));
        });

export const gnsSearchResourcesEpic = (action$, store) =>
    action$.ofType(SEARCH_RESOURCES)
        .switchMap(action => {
            const { pathname, params } = action;
            const state = store.getState();
            const currentParams = cleanParams(state?.gnsearch?.params);
            const nextParams = cleanParams(params);
            const DEFAULT_QUERY_KEYS = getQueryKeys();
            const currentQuery = Object.keys(currentParams).reduce((acc, key) =>
                DEFAULT_QUERY_KEYS.indexOf(key) === -1 ? { ...acc, [key]: currentParams[key] } : acc, {});
            const nextQuery = Object.keys(nextParams).reduce((acc, key) =>
                DEFAULT_QUERY_KEYS.indexOf(key) === -1 ? { ...acc, [key]: nextParams[key] } : acc, {});
            if (!isEqual(currentQuery, nextQuery)) {
                const isSamePath = state.router?.location?.pathname.indexOf(pathname) !== -1;
                return Observable.of(push({
                    ...(pathname && !isSamePath && { pathname }),
                    search: url.format({
                        query: nextQuery
                    })
                }));
            }
            if (!isEqual(currentParams, nextParams)) {
                return Observable.of(updateResourcesRequest({
                    action: 'PUSH',
                    params: nextParams,
                    location: state?.router?.location
                }));
            }
            return Observable.empty();
        });


const requestResourcesObservable = ({
    params,
    pageSize,
    reset,
    location
}, store) => {
    const customFilters = getCustomMenuFilters(store.getState());
    return Observable
        .defer(() => getResources({
            ...params,
            pageSize,
            customFilters
        }))
        .switchMap(({
            resources,
            total,
            isNextPageAvailable
        }) => {
            return Observable.of(
                updateResources(resources, reset),
                updateResourcesMetadata({
                    isNextPageAvailable,
                    params,
                    locationSearch: location.search,
                    locationPathname: location.pathname,
                    total
                }),
                loadingResources(false)
            );
        })
        .startWith(
            updateSuggestions([]),
            loadingResources(true)
        );
};

export const gnsSearchResourcesOnLocationChangeEpic = (action$, store) =>
    action$.ofType(LOCATION_CHANGE, UPDATE_RESOURCES_REQUEST)
        .filter(({ payload }) => {
            return payload.action === 'PUSH' || payload.action === 'POP';
        })
        .switchMap(action => {

            const PAGE_SIZE = getPageSize();
            const { isFirstRendering, location } = action.payload || {};
            const state = store.getState();

            const nextParams = state.gnsearch.nextParams;

            const [previousParams, previousPage] = getParams(state.gnsearch.locationSearch, state.gnsearch.params);
            const [currentParams, currentPage] = getParams(location.search, nextParams || {});

            // history action performed while navigating the browser history
            if (!nextParams) {
                const page = 1;
                const params = { ...currentParams, page };
                // avoid new request while browsing through history
                // if the latest saved request is equal to the new request
                if (!isFirstRendering && isEqual(previousParams, currentParams)) {
                    return Observable.empty();
                }
                return requestResourcesObservable({
                    params,
                    pageSize: PAGE_SIZE,
                    reset: true,
                    location
                }, store);
            }

            const resourcesLength = state.gnsearch?.resources.length || 0;
            const loadedPages = Math.floor(resourcesLength / PAGE_SIZE);
            const isNextPage = currentPage === previousPage + 1 && currentPage === loadedPages + 1;
            const resetSearch = isFirstRendering || !isEqual(previousParams, currentParams) || !isNextPage;
            const page = resetSearch ? 1 : currentPage;
            const params = { ...currentParams, page };

            return requestResourcesObservable({
                params,
                pageSize: PAGE_SIZE,
                reset: resetSearch,
                location
            }, store);
        });

export const gnsSelectResourceEpic = (action$, store) =>
    action$.ofType(REQUEST_RESOURCE)
        .switchMap(action => {
            if (isNil(action.pk)) {
                return Observable.of(setResource(null));
            }
            const state = store.getState();
            const resources = state.gnsearch?.resources || [];
            const selectedResource = resources.find(({ pk, resource_type: resourceType}) =>
                pk === action.pk && action.ctype === resourceType);
            return Observable.defer(() => getResourceByPk(action.pk))
                .switchMap((resource) => {
                    return Observable.of(setResource(resource));
                })
                .catch((error) => {
                    return Observable.of(resourceError(error.data || error.message));
                })
                .startWith(
                    // preload the resource if available
                    ...(selectedResource
                        ? [ setResource(selectedResource) ]
                        : [ resourceLoading() ])
                );
        });

export default {
    gnsFetchSuggestionsEpic,
    gnsSearchResourcesEpic,
    gnsSearchResourcesOnLocationChangeEpic,
    gnsSelectResourceEpic
};
