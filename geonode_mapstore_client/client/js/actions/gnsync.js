/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

/**
* Sync geostory components with their live resources on geonode
*/
export const SYNC_RESOURCES = 'GEONODE:SYNC_RESOURCES';

export function syncResources() {
    return {
        type: SYNC_RESOURCES
    };
}
