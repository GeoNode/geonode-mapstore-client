/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import { SYNC_RESOURCES } from '@js/actions/gnsync';
import { getViewedResourceType, getGeonodeResourceDataFromGeostory } from '@js/selectors/resource';
import { getMapByPk, getDocumentByPk } from '@js/api/geonode/v2';

const getRelevantResourceParams = (resourceType, state) => {
    let resources = [];
    switch (resourceType) {
    case 'geostory': {
        resources = getGeonodeResourceDataFromGeostory(state);
        return resources;
    }
    case 'dashboard': {
        // resources = getGeonodeResourceDataFromGeostory(state);
        return resources;
    }
    default:
        return resources;
    }
};

const setResourceApi = {
    map: getMapByPk,
    image: getDocumentByPk,
    video: getDocumentByPk
};

export const gnSyncComponentsWithResources = (action$, store) =>
    action$.ofType(SYNC_RESOURCES)
        .switchMap(() => {
            let state = store.getState();
            const resourceType = getViewedResourceType(state);
            let resources = getRelevantResourceParams(resourceType, state);
            return Observable.defer(() => {
                resources.forEach(resource => {
                    const resourceData = resource.data;
                    setResourceApi[resource.type](resource.id).then(data => {
                        resource.data = { ...resourceData, ...data.data.map };
                    });
                });
            });
        });

export default {
    gnSyncComponentsWithResources
};
