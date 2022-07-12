/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isNil from 'lodash/isNil';

import {
    SEARCH_RESOURCES,
    UPDATE_RESOURCES,
    LOADING_RESOURCES,
    UPDATE_RESOURCES_METADATA,
    SET_FEATURED_RESOURCES,
    REDUCE_TOTAL_COUNT
} from '@js/actions/gnsearch';

const defaultState = {
    resources: [],
    params: {},
    previousParams: {},
    isFirstRequest: true,
    featuredResources: {
        resources: []
    }
};

function gnsearch(state = defaultState, action) {
    switch (action.type) {
    case SEARCH_RESOURCES: {
        return {
            ...state,
            nextParams: action.params
        };
    }
    case UPDATE_RESOURCES: {
        return {
            ...state,
            isFirstRequest: false,
            resources: action.reset
                ? [ ...action.resources ]
                : [
                    ...state.resources,
                    ...action.resources
                ]
        };
    }
    case UPDATE_RESOURCES_METADATA: {
        return {
            ...state,
            total: action.metadata.total,
            isNextPageAvailable: action.metadata.isNextPageAvailable,
            ...(action.metadata.params &&
                {
                    params: action.metadata.params,
                    previousParams: state.params,
                    nextParams: null
                }),
            ...(!isNil(action.metadata.locationSearch) &&
                {
                    locationSearch: action.metadata.locationSearch
                }),
            ...(!isNil(action.metadata.locationPathname) &&
                {
                    locationPathname: action.metadata.locationPathname
                })
        };
    }
    case LOADING_RESOURCES: {
        return {
            ...state,
            loading: action.loading
        };
    }
    case SET_FEATURED_RESOURCES:
        return {
            ...state,
            featuredResources: {
                ...state.featuredResources,
                ...action.data
            }
        };
    case REDUCE_TOTAL_COUNT: {
        return {
            ...state,
            total: state.total - 1
        };
    }
    default:
        return state;
    }
}

export default gnsearch;
