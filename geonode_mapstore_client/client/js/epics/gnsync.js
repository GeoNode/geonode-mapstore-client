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

/**
 * Reformat responds object to match fields in resource object
 * @param {*} dataObj response object
 * @param  {...string} wantedFields fields in resource object
 * @returns {Object}
 */
const filterObj = (dataObj, ...wantedFields) => {
    const newResponseObj = {};
    Object.keys(dataObj).forEach((element) => {
        if (wantedFields.includes(element)) {
            newResponseObj[element] = dataObj[element];
        }
    });

    return newResponseObj;
};

/**
 * Sync reources in current geostory or dashboard with their respective sources
 * @param {*} action$ the actions
 * @param {Object} store
 * @returns {Observable}
 */
export const gnSyncComponentsWithResources = (action$, store) => action$.ofType(SYNC_RESOURCES)
    .switchMap(() => {
        const state = store.getState();
        const resourceType = getViewedResourceType(state);
        const resources = getRelevantResourceParams(resourceType, state);

        return Observable.defer(() =>
            axios.all(resources.map((resource) => setResourceApi[resource.type](resource.id)))
                .then(data => data)
        ).switchMap(updatedResources => {
            let currentResource;
            let newResourceData = {};

            resources.forEach((resource, index) => {
                currentResource = updatedResources.filter(res => res.pk === resource.id);
                newResourceData[index] = { ...resource.data, ...(currentResource?.[0]?.data?.map || currentResource[0] || {}) };
                newResourceData[index].description = currentResource[0].abstract?.replace(/<\/?[^>]+(>|$)/g, "");
                return resource;
            });

            return Observable.of(...resources.map((resource, index) => {
                return editResource(resource.id, resource.type, filterObj(newResourceData[index], ...Object.keys(resource.data)));
            }), saveSuccess(), successNotification({ title: 'gnviewer.syncSuccessTitle', message: 'gnviewer.syncSuccessDefault' }));
        }).catch((error) => {
            return Observable.of(
                saveError(error.data || error.message),
                errorNotification({ title: "gnviewer.syncErrorTitle", message: error?.data?.detail || error?.originalError?.message || error?.message || "gnviewer.syncErrorDefault" })
            );
        }).startWith(savingResource());
    });


export default {
    gnSyncComponentsWithResources
};
