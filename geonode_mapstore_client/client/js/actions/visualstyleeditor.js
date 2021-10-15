/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const REQUEST_DATASET_AVAILABLE_STYLES = 'GEONODE:REQUEST_DATASET_AVAILABLE_STYLES';
export const CREATE_GEONODE_STYLE = 'GEONODE:CREATE_GEONODE_STYLE';
export const DELETE_GEONODE_STYLE = 'GEONODE:DELETE_GEONODE_STYLE';

export function requestDatasetAvailableStyles(layer, options) {
    return {
        type: REQUEST_DATASET_AVAILABLE_STYLES,
        layer,
        options
    };
}

export function createGeoNodeStyle(title, options) {
    return {
        type: CREATE_GEONODE_STYLE,
        title,
        options
    };
}

export function deleteGeoNodeStyle(styleName, options) {
    return {
        type: DELETE_GEONODE_STYLE,
        styleName,
        options
    };
}
