/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const ProcessTypes = {
    DELETE_RESOURCE: 'deleteResource',
    CLONE_RESOURCE: 'cloneResource',
    PERMISSIONS_RESOURCE: 'permissionsResource'
};

export const ProcessStatus = {
    READY: 'ready',
    FAILED: 'failed',
    RUNNING: 'running',
    FINISHED: 'finished'
};

export const ProcessInterval = {
    [ProcessTypes.DELETE_RESOURCE]: 5000,
    [ProcessTypes.CLONE_RESOURCE]: 1000,
    [ProcessTypes.PERMISSIONS_RESOURCE]: 1000
};
