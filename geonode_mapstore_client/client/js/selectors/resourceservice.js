/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getResourceData } from '@js/selectors/resource';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { getSearchResults, getFeaturedResults } from '@js/selectors/search';
import { ResourceTypes } from '@js/utils/ResourceUtils';

export const isProcessCompleted = (state, payload) => {
    const completedProcess = state?.resourceservice?.processes?.find(process =>
        process?.resource?.pk === payload?.resource?.pk
        && process?.processType === payload?.processType
    ) || {};

    return completedProcess.completed;
};

export const processingDownload = (state) => {
    const resource = getResourceData(state);
    const pks = (resource.resource_type === ResourceTypes.MAP
        ? resource?.maplayers?.map(layer => layer?.dataset?.pk)
        : [resource?.pk])?.filter(Boolean);
    const isProcessingDownload = state?.resourceservice?.downloads?.find((download) =>
        pks.includes(download?.pk)
    );
    const downloading = isProcessingDownload ? true : false;
    return downloading;
};

export const generalResourceDownload = (state) => {
    const generalResources = getSearchResults(state);
    const downloads = state?.resourceservice?.downloads || [];
    const generalDownloads = generalResources?.reduce((acc, resource) => {
        const downloadingResources = downloads.find(download => download.pk === resource.pk);
        if (downloadingResources) {
            return [...acc, { ...resource }];
        }
        return [...acc];
    }, []);
    return generalDownloads;
};

export const featuredResourceDownload = (state) => {
    const featuredResources = getFeaturedResults(state);
    const downloads = state?.resourceservice?.downloads || [];
    const featuredDownloads = featuredResources?.reduce((acc, resource) => {
        const downloadingResources = downloads.find(download => download.pk === resource.pk);
        if (downloadingResources) {
            return [...acc, { ...resource }];
        }
        return [...acc];
    }, []);
    return featuredDownloads;
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
