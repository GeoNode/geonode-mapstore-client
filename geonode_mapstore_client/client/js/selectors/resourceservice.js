/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getResourceData } from '@js/selectors/resource';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';

export const isProcessCompleted = (state, payload) =>
    (state?.resourceservice?.processes?.find(process =>
        process?.resource?.pk === payload?.resource?.pk
            && process?.processType === payload?.processType
    ) || {}).completed;

export const getCurrentResourcePermissionsLoading = (state) => {
    const resource = getResourceData(state);
    const permissionsProcess = resource && state?.resourceservice?.processes?.find(process =>
        process?.resource?.pk === resource?.pk
            && process?.processType === ProcessTypes.PERMISSIONS_RESOURCE
    );
    const isLoading = permissionsProcess ? !permissionsProcess?.completed : false;
    return isLoading;
};
