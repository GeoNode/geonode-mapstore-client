/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef, useEffect, useState } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import uniq from 'lodash/uniq';
import useIsMounted from '@mapstore/framework/hooks/useIsMounted';
import { isEqual, isArray, omit, castArray } from 'lodash';

const cleanParams = (params, exclude = ['d']) => {
    return Object.keys(params)
        .filter((key) => !exclude.includes(key))
        .reduce((acc, key) =>
            (!params[key] || params[key].length === 0)
                ? acc : {
                    ...acc, [key]: isArray(params[key])
                        ? params[key].map(value => value + '')
                        : `${params[key]}`
                }, {});
};

const mergeParams = (params, defaultQuery) => {
    const updatedDefaultQuery = Object.keys(defaultQuery || {}).reduce((acc, key) => {
        if (defaultQuery[key] && params[key]) {
            return {
                ...acc,
                [key]: uniq([...castArray(defaultQuery[key]), ...castArray(params[key])])
            };
        }
        return {
            ...acc,
            [key]: defaultQuery[key]
        };
    }, {});
    return {
        ...params,
        ...updatedDefaultQuery
    };
};

/**
 * contains all the logic to update the resource grids content based on the params
 * @param {func} props.setLoading set the loading state
 * @param {func} props.setResources set the resource items returned by the request
 * @param {func} props.setResourcesMetadata set the resource metadata returned by the request
 * @param {func} props.request function returning the resources request
 * @param {object} props.defaultQuery default query object always applied to the requests
 * @param {number} props.pageSize page size for the request
 * @param {bool} props.queryPage if true adds the page to the  query
 */

const useQueryResourcesByParams = ({
    setLoading = () => {},
    setResources = () => {},
    setResourcesMetadata = () => {},
    request = () => Promise.resolve({}),
    defaultQuery,
    pageSize,
    user,
    queryPage = true,
}) => {

    const [query, setQuery] = useState(defaultQuery);
    const _prevQuery = useRef();
    const requestResources = useRef();
    const requestTimeout = useRef();

    const isMounted = useIsMounted();

    const source = useRef();
    const createToken = () => {
        if (source?.current?.cancel) {
            source.current?.cancel();
            source.current = undefined;
        }
        const cancelToken = axios.CancelToken;
        source.current = cancelToken.source();
    };

    const clearRequestTimeout = () => {
        if (requestTimeout.current) {
            clearTimeout(requestTimeout.current);
            requestTimeout.current = undefined;
        }
    };

    requestResources.current = (params) => {
        clearRequestTimeout();
        createToken();
        setLoading(true);
        requestTimeout.current = setTimeout(() => {
            const requestParams = cleanParams(mergeParams(params, defaultQuery));
            request({
                ...requestParams,
                pageSize,
                config: {
                    cancelToken: source?.current?.token
                }
            }, { user })
                .then((response) => isMounted(() => {
                    setResources(response.resources);
                    setResourcesMetadata({
                        isNextPageAvailable: response.isNextPageAvailable,
                        params,
                        total: response.total
                    });
                }))
                .catch((error) => isMounted(() => {
                    if (!axios.isCancel(error)) {
                        setResources([]);
                        setResourcesMetadata({
                            isNextPageAvailable: false,
                            params,
                            total: 0,
                            error: true
                        });
                    }
                }))
                .finally(() => isMounted(() => {
                    setLoading(false);
                }));
        }, 300);
    };

    const _queryPage = useRef();
    _queryPage.current = queryPage;

    const init = useRef();

    useEffect(() => {
        if (init.current) {
            const currentPage = queryPage ? (query.page || 1) : undefined;
            requestResources.current({
                ...query,
                ...(currentPage && { page: currentPage })
            });
        }
    }, [pageSize, JSON.stringify(defaultQuery), user]);

    useEffect(() => {
        const prevQuery = _prevQuery.current;
        const currentPage = queryPage ? (query.page || 1) : undefined;

        const isPageUpdated = queryPage
            ? query.page !== prevQuery?.page
            : false;

        const shouldUpdate = prevQuery === undefined
            || isPageUpdated
            || !isEqual(omit(query, ['page']), omit(prevQuery, ['page']));

        if (shouldUpdate) {
            requestResources.current({
                ...query,
                ...(currentPage && { page: currentPage })
            });
        }
        _prevQuery.current = query;

        if (!init.current) {
            init.current = true;
        }
    }, [query]);

    function handleSearch(nextParams) {
        if (nextParams?.page !== undefined && !queryPage) {
            requestResources.current({
                ...query,
                page: nextParams.page
            });
            return;
        }

        const nextQuery = cleanParams({
            ...omit(query, ['page']),
            ...nextParams
        }, []);

        setQuery(nextQuery);
    }


    function handleClear() {
        const { q, sort, 'filter{extension.in}': extension, ...filtersToRemove } = query;
        const clearedQuery = {
            ...defaultQuery,
            ...(q && { q }),
            ...(sort && { sort }),
            ...(extension && { 'filter{extension.in}': extension }),
            page: 1
        };
        setQuery(clearedQuery);
        requestResources.current({
            ...clearedQuery
        });
    }


    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (source?.current?.cancel) {
                source.current.cancel();
                source.current = undefined;
            }
            clearRequestTimeout();
        };
    }, []);

    return {
        search: handleSearch,
        clear: handleClear,
        query
    };
};

export default useQueryResourcesByParams;
