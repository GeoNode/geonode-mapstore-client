/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const SAVING_RESOURCE = 'GEONODE:SAVING_RESOURCE';
export const SAVE_SUCCESS = 'GEONODE:SAVE_SUCCESS';
export const SAVE_ERROR = 'GEONODE:SAVE_ERROR';
export const CLEAR_SAVE = 'GEONODE:CLEAR_SAVE';
export const SAVE_CONTENT = 'GEONODE:SAVE_CONTENT';
export const SAVE_DIRECT_CONTENT = 'GEONODE:SAVE_DIRECT_CONTENT';

/**
 * Actions for GeoNode save workflow
 * @module actions/gnsave
 */

/**
* Initialize saving loading state
*/
export function savingResource() {
    return {
        type: SAVING_RESOURCE
    };
}

/**
* Set success response of save workflow
* @param {object} success success response
*/
export function saveSuccess(success) {
    return {
        type: SAVE_SUCCESS,
        success
    };
}

/**
* Set error response of save workflow
* @param {object} error error response
*/
export function saveError(error) {
    return {
        type: SAVE_ERROR,
        error
    };
}

/**
* Clear state of actions.gnsave reducer
*/
export function clearSave() {
    return {
        type: CLEAR_SAVE
    };
}

/**
* Save or create a resource (trigger epic actions.gnsaveContent)
* @param {number|string} id resource id or primary key, create a new resource if undefined
* @param {object} metadata properties to update { name, description, thumbnail }
* @param {bool} reload reload page on create
* @param {bool} showNotifications show notifications to user
*/
export function saveContent(id, metadata, reload, showNotifications) {
    return {
        type: SAVE_CONTENT,
        id,
        metadata,
        reload,
        showNotifications
    };
}

/**
* Save or updates a resource (trigger epic actions.gnsaveDirectContent)
*/
export function saveDirectContent() {
    return {
        type: SAVE_DIRECT_CONTENT
    };
}
