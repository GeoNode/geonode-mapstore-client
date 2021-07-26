/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const REQUEST_DATASET_CONFIG = 'GEONODE_VIEWER:REQUEST_DATASET_CONFIG';
export const REQUEST_MAP_CONFIG = 'GEONODE_VIEWER:REQUEST_MAP_CONFIG';
export const REQUEST_NEW_MAP_CONFIG = 'GEONODE_VIEWER:REQUEST_NEW_MAP_CONFIG';
export const REQUEST_GEOSTORY_CONFIG = 'GEONODE_VIEWER:REQUEST_GEOSTORY_CONFIG';
export const REQUEST_DASHBOARD_CONFIG = 'GEONODE_VIEWER:REQUEST_DASHBOARD_CONFIG';
export const REQUEST_DOCUMENT_CONFIG = 'GEONODE_VIEWER:REQUEST_DOCUMENT_CONFIG';
export const REQUEST_NEW_GEOSTORY_CONFIG = "GEONODE:VIEWER:REQUEST_NEW_GEOSTORY_CONFIG";
export const REQUEST_NEW_DASHBOARD_CONFIG = "GEONODE:VIEWER:REQUEST_NEW_DASHBOARD_CONFIG";

export function requestDatasetConfig(pk, options) {
    return {
        type: REQUEST_DATASET_CONFIG,
        pk,
        options
    };
}

export function requestNewGeoStoryConfig() {
    return {
        type: REQUEST_NEW_GEOSTORY_CONFIG
    };
}

export function requestMapConfig(pk, options) {
    return {
        type: REQUEST_MAP_CONFIG,
        pk,
        options
    };
}

export function requestNewMapConfig() {
    return {
        type: REQUEST_NEW_MAP_CONFIG
    };
}


export function requestGeoStoryConfig(pk, options) {
    return {
        type: REQUEST_GEOSTORY_CONFIG,
        pk,
        options
    };
}

export function requestDocumentConfig(pk, options) {
    return {
        type: REQUEST_DOCUMENT_CONFIG,
        pk,
        options
    };
}

export function requestNewDashboardConfig() {
    return {
        type: REQUEST_NEW_DASHBOARD_CONFIG
    };
}

export function requestDashboardConfig(pk, options) {
    return {
        type: REQUEST_DASHBOARD_CONFIG,
        pk,
        options
    };
}
