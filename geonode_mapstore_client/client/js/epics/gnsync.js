/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import axios from '@mapstore/framework/libs/ajax';
import { SYNC_RESOURCES } from '@js/actions/gnsync';
import {
    savingResource, saveSuccess, saveError
} from '@js/actions/gnsave';
import { getViewedResourceType, getGeonodeResourceDataFromGeostory } from '@js/selectors/resource';
import { getMapByPk, getDocumentByPk } from '@js/api/geonode/v2';
import { editResource } from '@mapstore/framework/actions/geostory';
import {
    error as errorNotification,
    success as successNotification
    // warning as warningNotification
} from '@mapstore/framework/actions/notifications';

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

export const gnSyncComponentsWithResources = (action$, store) => action$.ofType(SYNC_RESOURCES)
    .switchMap(() => {
        const state = store.getState();
        const resourceType = getViewedResourceType(state);
        const resources = getRelevantResourceParams(resourceType, state);
        return Observable.defer(() =>
            axios.all(resources.map((resource) => setResourceApi[resource.type](resource.id)))
                .then(data => data)
                .catch((error) => error)
        ).switchMap(updatedResources => {
            let currentResource;
            let newReourceData = {};
            resources.forEach((resource, index) => {
                currentResource = updatedResources.filter(res => res.pk === resource.id);
                const resourceData = resource.data;
                newReourceData[index] = { ...resourceData, ...currentResource?.[0]?.data.map };
                return resource;
            });
            return Observable.of(...resources.map((resource, index) => {

                return editResource(resource.id, resource.type, newReourceData[index]);
            }), saveSuccess(), successNotification({ title: 'gnviewer.syncSuccessTitle', message: 'gnviewer.syncSuccessDefault' }));
        }).catch((error) => {
            return Observable.of(
                saveError(error.data || error.message),
                errorNotification({ title: "gnviewer.syncErrorTitle", message: error?.data?.detail || error?.message || "gnviewer.syncErrorDefault" })
            );
        }).startWith(savingResource());
    });


export default {
    gnSyncComponentsWithResources
};
