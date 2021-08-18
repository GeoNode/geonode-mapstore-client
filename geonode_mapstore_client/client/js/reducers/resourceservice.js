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

import {
    getLocalStorageProcesses,
    setLocalStorageProcesses
} from '@js/utils/LocalStorageUtils';

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
