/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const getUploadErrorMessageFromCode = (code, log) => {
    if (log) {
        // Make the error log more human readable
        const errorMsg = log.replace(/[()]/g, '')?.replace(/[\[\]']+/g, '')?.split('ErrorDetailstring=')?.join(' ');
        return errorMsg;
    }
    switch (code) {
    case 'upload_parallelism_limit_exceeded': {
        return 'parallelLimitError';
    }
    case 'total_upload_size_exceeded': {
        return 'fileExceeds';
    }
    case 'upload_exception':
    default:
        return 'invalidUploadMessageErrorTooltip';
    }
};
