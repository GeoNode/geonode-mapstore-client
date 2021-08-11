/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const getSearchResults = (state) => {
    const resources = state?.gnsearch?.resources || [];
    const processes = state?.resourceservice?.processes || [];
    return resources.map((resource) => {
        const resourceProcesses = processes.filter((process) => process?.resource?.pk === resource?.pk);
        if (resourceProcesses.length > 0) {
            return { ...resource, processes: resourceProcesses };
        }
        return resource;
    });
};

export const getFeaturedResults = (state) => {
    const resources = state?.gnsearch?.featuredResources?.resources || [];
    const processes = state?.resourceservice?.processes || [];
    return resources.map((resource) => {
        const resourceProcesses = processes.filter((process) => process?.resource?.pk === resource?.pk);
        if (resourceProcesses.length > 0) {
            return { ...resource, processes: resourceProcesses };
        }
        return resource;
    });
};
