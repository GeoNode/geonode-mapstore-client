/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';

let cache = {};

export const getNewMapConfiguration = (newMapUrl = '/static/mapstore/configs/map.json') => {
    return cache.newMapConfig
        ? new Promise((resolve) => resolve(cache.newMapConfig))
        : axios.get(newMapUrl).then(({ data }) => {
            cache.newMapConfig = data;
            return data;
        })
            .then((newMapConfig) => window.overrideNewMapConfig
                ? window.overrideNewMapConfig(newMapConfig)
                : newMapConfig
            );
};

export const getNewGeoStoryConfig = (newGeoStoryUrl = '/static/mapstore/configs/geostory.json') => {
    return cache.newGeoStoryConfig
        ? new Promise((resolve) => resolve(cache.newGeoStoryConfig))
        : axios.get(newGeoStoryUrl).then(({ data }) => {
            cache.newGeoStoryConfig = data;
            return data;
        })
            .then((newGeoStoryConfig) => window.overrideNewGeoStoryConfig
                ? window.overrideNewGeoStoryConfig(newGeoStoryConfig)
                : newGeoStoryConfig
            );
};

export const getStyleTemplates = (styleTemplatesUrl = '/static/mapstore/configs/styleTemplates.json') => {
    return cache.styleTemplatesConfig
        ? new Promise((resolve) => resolve(cache.styleTemplatesConfig))
        : axios.get(styleTemplatesUrl).then(({ data }) => {
            cache.styleTemplatesConfig = data?.templates;
            return cache.styleTemplatesConfig;
        });
};

export default {
    getNewMapConfiguration,
    getNewGeoStoryConfig,
    getStyleTemplates
};
