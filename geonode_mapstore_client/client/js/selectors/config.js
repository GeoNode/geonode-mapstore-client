/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import get from 'lodash/get';
import { getConfigProp } from "@mapstore/framework/utils/ConfigUtils";
import { userSelector } from '@mapstore/framework/selectors/security';
import { getMonitoredState, handleExpression } from '@mapstore/framework/utils/PluginsUtils';
import {
    filterMenuItems,
    reduceArrayRecursive,
    mapObjectFunc
} from '@js/utils/MenuUtils';

/**
 * get the parsed geonode configuration that take into account
 * user permissions and expressions
 * @param {object} state redux state
 */
export const getParsedGeoNodeConfiguration = (state) => {
    const user = userSelector(state);
    const monitoredState = getMonitoredState(state, getConfigProp('monitorState'));
    const geoNodeConfiguration = getConfigProp('geoNodeConfiguration');
    const getMonitorState = (path) => {
        return get(monitoredState, path);
    };
    const userState = { user };
    const confWithHandleExpression = mapObjectFunc(v => handleExpression(getMonitorState, {}, v))(geoNodeConfiguration);
    const filterMenuItemsAllowed = reduceArrayRecursive(confWithHandleExpression?.cardsMenu?.items, (item) => filterMenuItems(userState, item));
    const cardOptionsItemsAllowed = reduceArrayRecursive(confWithHandleExpression?.cardOptions?.items, (item) => filterMenuItems(userState, item));
    const filtersFormItemsAllowed = reduceArrayRecursive(confWithHandleExpression?.filtersForm?.items, (item) => filterMenuItems(userState, item));
    return {
        ...confWithHandleExpression,
        filterMenuItemsAllowed,
        cardOptionsItemsAllowed,
        filtersFormItemsAllowed
    };
};

/**
 * return all the custom filters available in the GeoNode configuration from localConfig
 * @param {object} state redux state
 */
export const getCustomMenuFilters = (state) => {
    const user = userSelector(state);
    const monitoredState = getMonitoredState(state, getConfigProp('monitorState'));
    const geoNodeConfiguration = getConfigProp('geoNodeConfiguration');
    const getMonitorState = (path) => {
        return get(monitoredState, path);
    };
    const userState = { user };
    const confWithHandleExpression = mapObjectFunc(v => handleExpression(getMonitorState, {}, v))(geoNodeConfiguration);
    const filtersFormItemsAllowed = reduceArrayRecursive(confWithHandleExpression?.filtersForm?.items, (item) => filterMenuItems(userState, item));
    const menuFilters = [
        ...filtersFormItemsAllowed
            .reduce((acc, item) => [
                ...acc,
                ...(item.type === 'group'
                    ? item.items || []
                    : [item])
            ], [])
            .reduce((acc, item) => [
                ...acc,
                ...(item.type === 'filter' && item.items
                    ? item.items && [...item.items, item] || []
                    : [item])
            ], [])
    ].filter(({ type }) => type === 'filter');
    return menuFilters;
};
