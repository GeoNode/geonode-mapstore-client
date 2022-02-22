/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getResourceData } from '@js/selectors/resource';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';

export const isProcessCompleted = (state, payload) => {
    const completedProcess = state?.resourceservice?.processes?.find(process =>
        process?.resource?.pk === payload?.resource?.pk
        && process?.processType === payload?.processType
    ) || {};

    return completedProcess.completed;
};

export const processingDownload = (state) => {
    const resource = getResourceData(state);
    const isProcessingDownload = state?.resourceservice?.processes?.find((process) =>
        process?.resource?.pk === resource?.pk
        && process?.processType === ProcessTypes.DOWNLOAD_RESOURCE
    );
    const processing = isProcessingDownload ? !isProcessingDownload.completed : false;
    return processing;
};

export const getCurrentResourcePermissionsLoading = (state) => {
    const resource = getResourceData(state);
    const permissionsProcess = resource && state?.resourceservice?.processes?.find(process =>
        process?.resource?.pk === resource?.pk
            && process?.processType === ProcessTypes.PERMISSIONS_RESOURCE
    );
    const isLoading = permissionsProcess ? !permissionsProcess?.completed : false;
    return isLoading;
};

export const getCurrentResourceCopyLoading = (state) => {
    const resource = getResourceData(state);
    const permissionsProcess = resource && state?.resourceservice?.processes?.find(process =>
        process?.resource?.pk === resource?.pk
            && process?.processType === ProcessTypes.COPY_RESOURCE
    );
    const isLoading = permissionsProcess ? !permissionsProcess?.completed : false;
    return isLoading;
};

export const getCurrentResourceDeleteLoading = (state) => {
    const resource = getResourceData(state);
    const permissionsProcess = resource && state?.resourceservice?.processes?.find(process =>
        process?.resource?.pk === resource?.pk
            && process?.processType === ProcessTypes.DELETE_RESOURCE
    );
    const isLoading = permissionsProcess ? !permissionsProcess?.completed : false;
    return isLoading;
};

export const getCurrentProcesses = (state) => {
    const processes = state?.resourceservice?.processes || [];
    return processes;
};
