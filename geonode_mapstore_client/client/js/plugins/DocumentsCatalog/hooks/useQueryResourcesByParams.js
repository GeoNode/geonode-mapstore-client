/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef, useEffect } from 'react';
import axios from '@mapstore/framework/libs/ajax';
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
 * contains all the logic to update the documetns catalog content based on the query params
 * @param {func} props.setLoading set the loading state
 * @param {func} props.setResources set the resource items returned by the request
 * @param {func} props.setResourcesMetadata set the resource metadata returned by the request
 * @param {func} props.request function returning the resources request
 * @param {object} props.defaultQuery default query object always applied to the requests
 * @param {number} props.pageSize page size for the request
 */

const useQueryResourcesByParams = ({
    setLoading = () => { },
    setResources = () => { },
    setResourcesMetadata = () => { },
    request = () => Promise.resolve({}),
    defaultQuery = {},
    pageSize = 20,
    user,
    monitoredState,
    queryParams = {}
}) => {
    const prevParams = useRef({});
    const requestTimeout = useRef();
    const requestResources = useRef();
    const source = useRef();
    const isMounted = useIsMounted();

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
                monitoredState,
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

    useEffect(() => {
        if (!isEqual(prevParams.current, queryParams)) {
            requestResources.current(queryParams);
            prevParams.current = queryParams;
        }
    }, [queryParams, pageSize, user]); 


    useEffect(() => {
        return () => {
            if (source?.current?.cancel) {
                source.current.cancel();
            }
            clearRequestTimeout();
        };
    }, []);

    return {};
};

export default useQueryResourcesByParams;