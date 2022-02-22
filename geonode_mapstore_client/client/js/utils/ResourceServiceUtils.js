/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const ProcessTypes = {
    DELETE_RESOURCE: 'deleteResource',
    COPY_RESOURCE: 'copyResource',
    PERMISSIONS_RESOURCE: 'permissionsResource',
    DOWNLOAD_RESOURCE: 'downloadResource'
};

export const ProcessStatus = {
    READY: 'ready',
    FAILED: 'failed',
    RUNNING: 'running',
    FINISHED: 'finished'
};

export const ProcessInterval = {
    [ProcessTypes.DELETE_RESOURCE]: 5000,
    [ProcessTypes.COPY_RESOURCE]: 1000,
    [ProcessTypes.PERMISSIONS_RESOURCE]: 1000
};

export const actionButtons = {
    'delete': {
        processType: ProcessTypes.DELETE_RESOURCE,
        isControlled: true
    },
    'copy': {
        processType: ProcessTypes.COPY_RESOURCE,
        isControlled: true
    },
    'download': {
        processType: ProcessTypes.DOWNLOAD_RESOURCE,
        isControlled: false
    }
};
