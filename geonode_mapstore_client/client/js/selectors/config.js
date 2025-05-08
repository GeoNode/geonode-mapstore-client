/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import get from 'lodash/get';
import { getConfigProp } from "@mapstore/framework/utils/ConfigUtils";
import { handleExpression } from '@mapstore/framework/utils/PluginsUtils';
import { mapObjectFunc } from '@js/utils/MenuUtils';


/**
* @module selectors/config
*/

/**
 * return all the custom filters available in the GeoNode configuration from localConfig
 * @param {object} monitoredState monitored state
 */
export const getCustomMenuFilters = (monitoredState) => {
    const geoNodeCustomFilters = getConfigProp('geoNodeCustomFilters');
    const getMonitorState = (path) => {
        return get(monitoredState, path);
    };
    const parsedGeoNodeCustomFilters = mapObjectFunc(v => handleExpression(getMonitorState, {}, v))(geoNodeCustomFilters || {});
    const menuFilters = Object.keys(parsedGeoNodeCustomFilters).reduce((acc, id) => {
        return [...acc, { id, query: parsedGeoNodeCustomFilters[id] }];
    }, []);
    return menuFilters;
};
