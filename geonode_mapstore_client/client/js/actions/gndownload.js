/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// Sync geostory components with their live resources on geonode

export const DOWNLOAD_METADATA = 'GEONODE:DOWNLOAD_METADATA';
export const DOWNLOAD_METADATA_COMPLETE = 'GEONODE:DOWNLOAD_METADATA_COMPLETE';

export function downloadMetaData(linkType, pk) {
    return {
        type: DOWNLOAD_METADATA,
        link: linkType,
        pk
    };
}

export function downloadMetaDataComplete(linkType, pk) {
    return {
        type: DOWNLOAD_METADATA_COMPLETE,
        link: linkType,
        pk
    };
}
