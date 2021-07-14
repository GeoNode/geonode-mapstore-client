/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';

export const getNewMapConfiguration = (newMapUrl = '/static/mapstore/configs/map.json') => {
    return axios.get(newMapUrl)
        .then(({ data }) => window.overrideNewMapConfig ? window.overrideNewMapConfig(data) : data);
};

export const getNewGeoStoryConfig = (newGeoStoryUrl = '/static/mapstore/configs/geostory.json') => {
    return axios.get(newGeoStoryUrl)
        .then(({ data }) => window.overrideNewGeoStoryConfig ? window.overrideNewGeoStoryConfig(data) : data);
};

export default {
    getNewMapConfiguration,
    getNewGeoStoryConfig
};
