/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const REQUEST_DATASET_AVAILABLE_STYLES = 'GEONODE:REQUEST_DATASET_AVAILABLE_STYLES';

export function requestDatasetAvailableStyles(layer, options) {
    return {
        type: REQUEST_DATASET_AVAILABLE_STYLES,
        layer,
        options
    };
}
