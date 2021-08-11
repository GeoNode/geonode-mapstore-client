/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const START_ASYNC_PROCESS = 'GEONODE:START_ASYNC_PROCESS';
export const STOP_ASYNC_PROCESS = 'GEONODE:STOP_ASYNC_PROCESS';
export const UPDATE_ASYNC_PROCESS = 'GEONODE:UPDATE_ASYNC_PROCESS';

export function startAsyncProcess(payload) {
    return {
        type: START_ASYNC_PROCESS,
        payload
    };
}

export function updateAsyncProcess(payload) {
    return {
        type: UPDATE_ASYNC_PROCESS,
        payload
    };
}

export function stopAsyncProcess(payload) {
    return {
        type: STOP_ASYNC_PROCESS,
        payload
    };
}
