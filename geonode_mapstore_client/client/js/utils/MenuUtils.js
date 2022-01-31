/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import get from 'lodash/get';
import isNil from 'lodash/isNil';

function inAllowedGroups(user, allowedRoles) {
    const groups = user?.info?.groups || [];
    return !allowedRoles || !!groups.find(group => allowedRoles.indexOf(group) !== -1);
}

/**
* @module utils/MenuUtils
*/

/**
* check if the menu perms is allowed by user or resource
* @param {array} perms array with perms of user or resource
* @param {array} objResource menu or resource perms
* @param {string} objType type of objcet (user / resource)
* @return {boolean}
*/
export function hasPermissionsTo(perms, objResource, objType) {

    const res = (objResource) ? objResource.filter(obj => obj.type === objType) : undefined;
    return res === undefined
    || (res && res.length === 0)
    || (res && res.some((element) => {
        return perms && perms.includes(element?.value);
    }));
}

export function readProperty(state, value) {
    if (value?.indexOf('${') === 0) {
        return get(state, value.replace(/^\$\{(.*)\}$/, '$1'));
    }
    return value;
}

export function buildHrefByTemplate(state, template, sep = '/') {
    const splittedTmpl = (template).split(sep);
    const properties = splittedTmpl.map( val => readProperty(state, val));
    return properties.join(sep);
}

export function filterMenuItems(state, item, parent) {

    if (item.disableIf) {
        return false;
    }

    const isAuthenticated = !parent
        ? item.authenticated
        : parent.authenticated === undefined
            ? item.authenticated
            : parent.authenticated;

    return isAuthenticated === undefined
        || (isAuthenticated === true && state?.user
            && inAllowedGroups(state.user, item.allowedGroups)
            && hasPermissionsTo(state?.user?.perms, item.perms, 'user'))
        || isAuthenticated === false && !state?.user;
}

export const isValidBadgeValue = value => !!(value !== '' && !isNil(value));

export const mapObjectFunc = func => {
    const iter = value => value && typeof value === 'object'
        ? Array.isArray(value)
            ? value.map(iter)
            : Object.fromEntries(Object.entries(value).map(([key, val]) => [key, iter(val, func)]))
        : func(value);
    return iter;
};

export const reduceArrayRecursive = (arr, func) => {
    return arr && arr.reduce(
        (acc, item) => {
            const newItem = item;
            Object.entries(item).forEach(([key, value])=>{
                if (Array.isArray(value)) {
                    newItem[key] = reduceArrayRecursive(item[key], func);
                }
            });
            func(newItem) ? acc.push(newItem) : undefined;

            return acc;
        },
        []
    );
};
