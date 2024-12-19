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
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';

export const hasExtensionInUrl = (remoteResource) => {
    const { url: remoteUrl } = remoteResource || {};
    const {ext} = getFileNameAndExtensionFromUrl(remoteUrl);
    return !isEmpty(ext);
};

export const isNotSupported = (remoteResource) => !isNil(remoteResource?.supported) && !remoteResource?.supported;

export const getErrorMessageId = (remoteResource, { remoteTypeErrorMessageId } = {}) => {
    const { validation } = remoteResource || {};
    const {
        isRemoteUrlDuplicated,
        isValidRemoteUrl,
        isRemoteTypeSupported
    } = validation || {};
    if (!isValidRemoteUrl) {
        return 'gnviewer.invalidUrl';
    }
    if (!isRemoteTypeSupported) {
        return remoteTypeErrorMessageId;
    }
    if (isRemoteUrlDuplicated) {
        return 'gnviewer.duplicateUrl';
    }
    return 'gnviewer.invalidUrl';
};

export const getSupportedTypeExt = (supportedType = {}) => {
    return [...(supportedType.required_ext || []), ...(supportedType.optional_ext || [])];
};

export const getSupportedTypes = (ext, supportedFiles) => {
    return supportedFiles.filter((supportedType) =>
        getSupportedTypeExt(supportedType).includes(ext)
    );
};

export const parseFileResourceUploads = (prevUploads = [], nextUploads = [], { supportedFiles = [] } = {}) => {
    return nextUploads.reduce((acc, _upload) => {
        if (_upload.type === 'remote') {
            acc.push(_upload);
            return acc;
        }
        const { file, ext, baseName, id } = _upload;
        const entry = acc.find((upload) => {
            if (upload.type === 'file' && upload.baseName === baseName) {
                const currentSupportedTypes = getSupportedTypes(ext, supportedFiles);
                return currentSupportedTypes
                    ? currentSupportedTypes.find((supportedType) => {
                        return upload.ext.every(uploadExt => getSupportedTypeExt(supportedType).includes(uploadExt));
                    })
                    : false;
            }
            return false;
        });
        if (entry) {
            return acc.map((prevUpload) => {
                if (prevUpload.id === entry.id) {
                    return {
                        ...prevUpload,
                        files: {
                            ...entry.files,
                            [ext]: file
                        },
                        ...(!prevUpload.ext.includes(ext) && {
                            ext: [...prevUpload.ext, ext]
                        })
                    };
                }
                return prevUpload;
            });
        }
        return [
            ...acc,
            {
                id,
                baseName,
                type: 'file',
                files: { [ext]: file },
                ext: [ext],
                supported: !!getSupportedTypes(ext, supportedFiles)?.length
            }
        ];
    }, [...prevUploads.filter(upload => upload.type === 'file' ? upload.supported : true)]);
};

export const validateFileResourceUploads = (uploads = [], { supportedFiles = [] } = {}) => {
    return uploads.map((upload) => {
        if (!upload.supported || upload.type === 'remote') {
            return upload;
        }
        const currentSupportedType = supportedFiles.find((supportedType) => {
            return upload.ext.every(uploadExt => getSupportedTypeExt(supportedType).includes(uploadExt));
        });
        if (!currentSupportedType) {
            return {
                ...upload,
                supported: false
            };
        }
        const missingExtensions = currentSupportedType.required_ext.filter(ext => !upload.ext.includes(ext));
        const supportedTypeExtensions = getSupportedTypeExt(currentSupportedType);
        return {
            ...upload,
            ext: [...upload.ext].sort((a, b) => supportedTypeExtensions.indexOf(a) - supportedTypeExtensions.indexOf(b)),
            ready: missingExtensions.length === 0,
            missingExtensions: missingExtensions.length > 0 && missingExtensions.length === currentSupportedType.required_ext.length
                ? ['*']
                : missingExtensions
        };
    });
};

export const validateRemoteResourceUploads = (uploads = [], { remoteTypes } = {}) => {
    const remoteUrls = uploads.map((upload) => upload.type === 'remote' ? (upload.url || '') : null);
    return uploads.map((upload, idx) => {
        if (upload.type !== 'remote') {
            return upload;
        }
        const isRemoteUrlDuplicated = remoteUrls.filter(remoteUrl => remoteUrl === upload.url)?.length > 1
            && remoteUrls.indexOf(upload.url) !== idx;
        const isValidRemoteUrl = !!upload.url
            && !(upload.url.indexOf('/') === 0) // is not relative
            && isValidURL(upload.url);
        const isRemoteTypeSupported = remoteTypes ? !!remoteTypes.find(({ value }) => value === upload.remoteType) : true;
        const supported = !!(!isRemoteUrlDuplicated && isValidRemoteUrl && isRemoteTypeSupported);
        return {
            ...upload,
            supported,
            ready: supported,
            validation: {
                isRemoteUrlDuplicated,
                isValidRemoteUrl,
                isRemoteTypeSupported
            }
        };
    });
};

export const getUploadMainFile = ({ upload } = {}) => {
    return upload?.files?.[upload?.ext?.[0]];
};

export const getUploadFileName = ({ upload } = {}, remoteUrl) => {
    if (upload?.type === 'remote') {
        return remoteUrl ? upload.url : getFileNameAndExtensionFromUrl(upload.url)?.fileName || upload.url;
    }
    return upload?.files?.[upload?.ext?.[0]]?.name;
};

export const getUploadProperty = (key) => {
    return ({ upload } = {}) => {
        return upload?.[key];
    };
};

export const getSize = (files = {}, asLabel) => {
    const bytes = Object.keys(files).reduce((sum, ext) => {
        return sum + files[ext].size;
    }, 0);
    const mb = bytes / (1024 * 1024);
    if (asLabel) {
        return mb > 0.9 ? `${Math.ceil(mb)} MB` : `${Math.ceil(mb * 1024)} KB`;
    }
    return mb;
};

export const getExceedingFileSize = (uploads, limit) => {
    return uploads.some(({ type, files }) => type === 'remote' ? false : getSize(files) > limit);
};

export const getMaxParallelUploads = () => {
    const { maxParallelUploads } = getConfigProp('geoNodeSettings') || {};
    return maxParallelUploads;
};

export const getMaxAllowedSizeByResourceType = (resourceType) => {
    const { datasetMaxUploadSize, documentMaxUploadSize } = getConfigProp('geoNodeSettings');
    const maxAllowedBytes = resourceType === 'dataset' ? datasetMaxUploadSize : documentMaxUploadSize;
    const maxAllowedSize = Math.floor(maxAllowedBytes / (1024 * 1024));
    return maxAllowedSize;
};

export const getSupportedFilesByResourceType = (resourceType, { actions } = {}) => {
    if (resourceType === 'document') {
        const { allowedDocumentTypes } = getConfigProp('geoNodeSettings') || [];
        return allowedDocumentTypes.map((ext) => {
            return {
                id: ext,
                label: ext,
                required_ext: [ext]
            };
        });
    }
    const { upload: uploadSettings = {} } = getConfigProp('geoNodeSettings') || {};
    const { supportedDatasetFileTypes: supportedDatasetTypes } = uploadSettings;
    return (supportedDatasetTypes || [])
        .map((supportedType) => supportedType.formats.map(format => ({ ...supportedType, ...format })))
        .flat()
        .filter(supportedType => actions ? supportedType.actions.some(value => actions.includes(value)) : true);
};
