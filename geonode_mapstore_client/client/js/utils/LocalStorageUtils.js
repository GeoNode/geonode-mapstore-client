/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { ProcessStatus } from '@js/utils/ResourceServiceUtils';

const LOCAL_STORAGE_PROCESSES_KEY = 'gn.reducers.resourceservice.processes';

export function getLocalStorageProcesses() {
    try {
        const processes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROCESSES_KEY)) || [];
        return processes.filter(({ completed, output }) => !(completed || output?.status === ProcessStatus.FINISHED || output?.status === ProcessStatus.FAILED));
    } catch (e) {
        return [];
    }
}

export function setLocalStorageProcesses(reducer) {
    return (state, action) => {
        const newState = reducer(state, action);
        try {
            localStorage.setItem(LOCAL_STORAGE_PROCESSES_KEY, JSON.stringify(newState.processes));
        } catch (e) {/**/}

        return newState;
    };
}
