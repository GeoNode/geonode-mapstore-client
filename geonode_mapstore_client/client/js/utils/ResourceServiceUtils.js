/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import flatten from 'lodash/flatten';

export const ProcessTypes = {
    DELETE_RESOURCE: 'deleteResource',
    COPY_RESOURCE: 'copyResource',
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
    }
};

export const extractExecutionsFromResources = (resources, username) => {
    const processingResources = resources
        .filter((resource) => (
            resource.executions?.length > 0
            && resource.executions.find(({ status_url: statusUrl, user }) =>
                statusUrl && user && user === username
            )
        ));
    return flatten(processingResources.map((resource) => {
        return resource.executions
            .filter(({
                func_name: funcName,
                status_url: statusUrl,
                user
            }) =>
                funcName === 'copy'
                && statusUrl && user && user === username
            ).map((output) => {
                return {
                    resource,
                    output,
                    processType: ProcessTypes.COPY_RESOURCE
                };
            });
    }));
};
