/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import {
    START_ASYNC_PROCESS,
    STOP_ASYNC_PROCESS,
    UPDATE_ASYNC_PROCESS
} from '@js/actions/resourceservice';

import { ProcessStatus } from '@js/utils/ResourceServiceUtils';

const LOCAL_STORAGE_PROCESSES_KEY = 'gn.reducers.resourceservice.processes';

function getLocalStorageProcesses() {
    try {
        const processes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_PROCESSES_KEY)) || [];
        return processes.filter(({ completed, output }) => !(completed || output?.status === ProcessStatus.FINISHED || output?.status === ProcessStatus.FAILED));
    } catch (e) {
        return [];
    }
}

function setLocalStorageProcesses(reducer) {
    return (state, action) => {
        const newState = reducer(state, action);
        try {
            localStorage.setItem(LOCAL_STORAGE_PROCESSES_KEY, JSON.stringify(newState.processes));
        } catch (e) {/**/}

        return newState;
    };
}

const defaultState = {
    processes: getLocalStorageProcesses()
};

function resourceservice(state = defaultState, action) {
    switch (action.type) {
    case START_ASYNC_PROCESS: {
        return {
            ...state,
            processes: [
                // remove previous process if same id and type
                ...state.processes.filter((process) => !(
                    process?.resource?.pk === action?.payload?.resource?.pk
                    && process?.processType === action?.payload?.processType
                )),
                action.payload
            ]
        };
    }
    case UPDATE_ASYNC_PROCESS: {
        return {
            ...state,
            processes: state.processes.map((process) =>
                process?.resource?.pk === action?.payload?.resource?.pk
                && process?.processType === action?.payload?.processType
                    ? action.payload
                    : process)
        };
    }
    case STOP_ASYNC_PROCESS: {
        return {
            ...state,
            processes: state.processes.map((process) =>
                process?.resource?.pk === action?.payload?.resource?.pk
                && process?.processType === action?.payload?.processType
                    ? action.payload
                    : process)
        };
    }
    default:
        return state;
    }
}

export default setLocalStorageProcesses(resourceservice);
