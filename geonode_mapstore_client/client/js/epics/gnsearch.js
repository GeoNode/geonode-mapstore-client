/*
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
    getResources,
    getResourceByPk,
    getFeaturedResources,
    getResourceByUuid
} from '@js/api/geonode/v2';
import {
    SEARCH_RESOURCES,
    REQUEST_RESOURCE,
    updateResources,
    loadingResources,
    updateResourcesMetadata,
    setFeaturedResources,
    UPDATE_FEATURED_RESOURCES
} from '@js/actions/gnsearch';
import {
    resourceLoading,
    setResource,
    resourceError,
    processResources
} from '@js/actions/gnresource';
import {
    LOCATION_CHANGE,
    push
} from 'connected-react-router';
import {
    getQueryKeys,
    getPageSize
} from '@js/utils/SearchUtils';
import url from 'url';
import { getCustomMenuFilters } from '@js/selectors/config';
import { STOP_ASYNC_PROCESS, stopAsyncProcess } from '@js/actions/resourceservice';
import {
    ProcessTypes,
    ProcessStatus
} from '@js/utils/ResourceServiceUtils';
import { getCurrentProcesses } from '@js/selectors/resourceservice';
import { userSelector } from '@mapstore/framework/selectors/security';

const UPDATE_RESOURCES_REQUEST = 'GEONODE_SEARCH:UPDATE_RESOURCES_REQUEST';
const updateResourcesRequest = (payload, reset) => ({
    type: UPDATE_RESOURCES_REQUEST,
    payload,
    reset
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

const getNextPage = (action, state) => {
    if (!action) {
        return 1;
    }
    const currentPage = state.gnsearch?.featuredResources?.page || 1;
    const isNextPageAvailable =  state.gnsearch?.featuredResources?.isNextPageAvailable;
    if (action === 'next' && isNextPageAvailable) {
        return currentPage + 1;
    }
    const isPreviousPageAvailable = state.gnsearch?.featuredResources?.isPreviousPageAvailable;

    return isPreviousPageAvailable ? currentPage - 1 : 1;
};

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
    const state = store.getState();
    const customFilters = getCustomMenuFilters(state);
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
            const currentUser = userSelector(state);
            const processingResources = resources.filter((resource) => (resource.executions?.length > 0 && resource.executions[0].status_url && resource.executions[0].user === currentUser?.info?.preferred_username) && { ...resource, executions: resource.executions[0] });
            return Observable.of(
                ...processingResources.map((resource) => {
                    const process = `${resource?.executions[0].func_name}Resource`;
                    return processResources(process, [resource], false);
                }),
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
            const ongoingProcesses = getCurrentProcesses(state);

            // stop ongoing processes everytime there is a location change or new request is made
            ongoingProcesses.length > 0 && ongoingProcesses.forEach((process) => stopAsyncProcess({ ...process, complete: true }));

            const nextParams = state.gnsearch.nextParams;

            const [previousParams, previousPage] = getParams(state.gnsearch.locationSearch, state.gnsearch.params);
            const [currentParams, currentPage] = getParams(location.search, nextParams || {});

            // history action performed while navigating the browser history
            if (!nextParams || action.reset) {
                const page = 1;
                const params = { ...currentParams, page };
                // avoid new request while browsing through history
                // if the latest saved request is equal to the new request
                if (!isFirstRendering && isEqual(previousParams, currentParams) && !action.reset) {
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
                    return Observable.of(setResource({
                        ...resource,
                        /* store information related to detail */
                        '@ms-detail': true
                    }));
                })
                .catch((error) => {
                    return Observable.of(resourceError(error.data || error.message));
                })
                .startWith(
                    // preload the resource if available
                    ...(selectedResource
                        ? [ setResource({
                            ...selectedResource,
                            /* store information related to detail */
                            '@ms-detail': true
                        }) ]
                        : [ resourceLoading() ])
                );
        });

export const getFeaturedResourcesEpic = (action$, {getState = () => {}}) =>
    action$.ofType(UPDATE_FEATURED_RESOURCES)
        .switchMap(({action, pageSize}) => {
            const page = getNextPage(action, getState());
            return Observable.defer( () => getFeaturedResources(page, pageSize))
                .switchMap((data) => {
                    return Observable.of(setFeaturedResources({...data,
                        isNextPageAvailable: !!data?.links?.next,
                        isPreviousPageAvailable: !!data?.links.previous, loading: false}));
                }).catch((error) => {
                    return Observable.of(resourceError(error.data || error.message), setFeaturedResources({loading: false}));
                }).startWith(setFeaturedResources({loading: true}));
        });

export const gnWatchStopCopyProcessOnSearch = (action$, store) =>
    action$.ofType(STOP_ASYNC_PROCESS)
        .filter(action => action?.payload?.processType === ProcessTypes.COPY_RESOURCE)
        .flatMap((action) => {
            const isError = action?.payload?.error || action?.payload?.output?.status === ProcessStatus.FAILED;
            if (isError) {
                return Observable.empty();
            }
            const newResourceUuid = action?.payload?.output?.output_params?.output?.uuid;
            if (newResourceUuid === undefined) {
                return Observable.empty();
            }
            const pk = action?.payload?.output?.input_params?.instance;
            return Observable.defer(() => getResourceByUuid(newResourceUuid))
                .switchMap((resource) => {
                    const resources = store.getState().gnsearch?.resources || [];
                    const newResources = resources.reduce((acc, res) => {
                        if (res.pk === (pk + '')) {
                            return [...acc, { ...resource, '@temporary': true }, res];
                        }
                        return [...acc, res];
                    }, []);
                    return Observable.of(updateResources(newResources, true));
                });
        });

export default {
    gnsSearchResourcesEpic,
    gnsSearchResourcesOnLocationChangeEpic,
    gnsSelectResourceEpic,
    getFeaturedResourcesEpic,
    gnWatchStopCopyProcessOnSearch
};
