/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const SEARCH_RESOURCES = 'GEONODE_SEARCH:SEARCH_RESOURCES';
export const UPDATE_RESOURCES = 'GEONODE_SEARCH:UPDATE_RESOURCES';
export const LOADING_RESOURCES = 'GEONODE_SEARCH:LOADING_RESOURCES';
export const SELECT_RESOURCE = 'GEONODE_SEARCH:SELECT_RESOURCE';
export const REQUEST_RESOURCE = 'GEONODE_SEARCH:REQUEST_RESOURCE';
export const UPDATE_RESOURCES_METADATA = 'GEONODE_SEARCH:UPDATE_RESOURCES_METADATA';
export const SET_FEATURED_RESOURCES = 'GEONODE:SET_FEATURED_RESOURCES';
export const UPDATE_FEATURED_RESOURCES = 'GEONODE_SEARCH:UPDATE_FEATURED_RESOURCES';

export function searchResources(params, pathname) {
    return {
        type: SEARCH_RESOURCES,
        params,
        pathname
    };
}

export function updateResources(resources, reset) {
    return {
        type: UPDATE_RESOURCES,
        resources,
        reset
    };
}

export function updateResourcesMetadata(metadata) {
    return {
        type: UPDATE_RESOURCES_METADATA,
        metadata
    };
}

export function loadingResources(loading) {
    return {
        type: LOADING_RESOURCES,
        loading
    };
}

export function requestResource(pk, ctype) {
    return {
        type: REQUEST_RESOURCE,
        pk,
        ctype
    };
}


/**
* Actions for GeoNode resource featured items
* set new Featured Resources includes data, page, links
* @name actions.gnsearch
*/
export function setFeaturedResources(data) {
    return {
        type: SET_FEATURED_RESOURCES,
        data
    };
}

/**
* Actions for GeoNode resource featured items
* loads new featured resources basing on the action, previous or next
* @param action {string} can be either next or previous
* @param pageSize { number } page_size of items to load defaults to 4;
* @name actions.gnsearch
*/
export function loadFeaturedResources(action, pageSize = 4) {
    return {
        type: UPDATE_FEATURED_RESOURCES,
        action,
        pageSize
    };
}

export default {
    SEARCH_RESOURCES,
    searchResources,
    UPDATE_RESOURCES,
    updateResources,
    LOADING_RESOURCES,
    loadingResources,
    REQUEST_RESOURCE,
    requestResource,
    setFeaturedResources
};
