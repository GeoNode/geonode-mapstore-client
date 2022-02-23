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
    DOWNLOAD_RESOURCE,
    PROCESS_RESOURCES,
    DOWNLOAD_COMPLETE
} from '@js/actions/gnresource';

const defaultState = {
    processes: [],
    downloads: []
};

function resourceservice(state = defaultState, action) {
    switch (action.type) {
    case PROCESS_RESOURCES: {
        return {
            ...state,
            processes: [
                ...state.processes.filter((process) =>
                    !action.resources.find((resource) =>
                        process?.resource?.pk === resource?.pk
                        && process?.processType === action.processType
                    )
                ),
                ...action.resources.map((resource) => ({ resource, processType: action.processType }))
            ]
        };
    }
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
    case STOP_ASYNC_PROCESS:
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
    case DOWNLOAD_RESOURCE: {
        return {
            ...state,
            downloads: [
                ...state.downloads,
                action.resource
            ]
        };
    }
    case DOWNLOAD_COMPLETE: {
        return {
            ...state,
            downloads: [
                ...state.downloads.filter((download) =>
                    (download?.resource?.pk === action?.resource?.pk))
            ]
        };
    }
    default:
        return state;
    }
}

export default resourceservice;
