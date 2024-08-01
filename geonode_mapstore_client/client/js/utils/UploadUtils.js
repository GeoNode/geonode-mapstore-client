/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import { isValidURL } from "@mapstore/framework/utils/URLUtils";
import { getFileNameAndExtensionFromUrl } from "@js/utils/FileUtils";

export const hasExtensionInUrl = (remoteResource) => {
    const { remoteUrl } = remoteResource || {};
    const {ext} = getFileNameAndExtensionFromUrl(remoteUrl);
    return !isEmpty(ext);
};

export const isNotSupported = (remoteResource) => !isNil(remoteResource?.supported) && !remoteResource?.supported;

export const getErrorMessageId = (remoteResource) => {
    const { validation } = remoteResource || {};
    const {
        isRemoteUrlDuplicated,
        isValidRemoteUrl,
        isExtensionSupported,
        isServiceTypeSupported
    } = validation || {};
    if (!isValidRemoteUrl) {
        return 'gnviewer.invalidUrl';
    }
    if (!isExtensionSupported) {
        return 'gnviewer.unsupportedUrlExtension';
    }
    if (!isServiceTypeSupported) {
        return 'gnviewer.unsupportedUrlServiceType';
    }
    if (isRemoteUrlDuplicated) {
        return 'gnviewer.duplicateUrl';
    }
    return 'gnviewer.invalidUrl';
};

export const validateRemoteResourceUploads = (newRemoteResourceUploads = [], { serviceTypes, extensions } = {}) => {
    const remoteUrls = newRemoteResourceUploads.map(({ remoteUrl }) => remoteUrl);
    return newRemoteResourceUploads.map((remoteResourceUpload, idx) => {
        const isRemoteUrlDuplicated = remoteUrls.filter(remoteUrl => remoteUrl === remoteResourceUpload.remoteUrl)?.length > 1
            && remoteUrls.indexOf(remoteResourceUpload.remoteUrl) !== idx;
        const isValidRemoteUrl = !!remoteResourceUpload.remoteUrl
            && !(remoteResourceUpload.remoteUrl.indexOf('/') === 0) // is not relative
            && isValidURL(remoteResourceUpload.remoteUrl);
        const isExtensionSupported = extensions ? !!extensions.find(({ value }) => value === remoteResourceUpload.extension) : true;
        const isServiceTypeSupported = serviceTypes ? !!serviceTypes.find(({ value }) => value === remoteResourceUpload.serviceType) : true;
        return {
            ...remoteResourceUpload,
            supported: !!(!isRemoteUrlDuplicated && isValidRemoteUrl && isExtensionSupported && isServiceTypeSupported),
            validation: {
                isRemoteUrlDuplicated,
                isValidRemoteUrl,
                isExtensionSupported,
                isServiceTypeSupported
            }
        };
    });
};
