/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import axios from '@mapstore/framework/libs/ajax';
import { merge, uniq } from 'lodash';
import { SYNC_RESOURCES } from '@js/actions/gnsync';
import {
    savingResource, saveSuccess
} from '@js/actions/gnsave';
import { getViewedResourceType, getGeoNodeResourceDataFromGeoStory, getGeoNodeResourceFromDashboard } from '@js/selectors/resource';
import { getMapsByPk, getDocumentsByPk } from '@js/api/geonode/v2';
import { editResource } from '@mapstore/framework/actions/geostory';
import {
    show as showNotification,
    error as errorNotification
} from '@mapstore/framework/actions/notifications';
import { parseMapConfig, parseDocumentConfig } from '@js/utils/ResourceUtils';
import { dashboardResource, originalDataSelector } from '@mapstore/framework/selectors/dashboard';
import { dashboardLoaded } from '@mapstore/framework/actions/dashboard';

/**
* @module epics/gnsync
*/

const getRelevantResourceParams = (resourceType, state) => {
    switch (resourceType) {
    case 'geostory': {
        return getGeoNodeResourceDataFromGeoStory(state);
    }
    case 'dashboard': {
        return getGeoNodeResourceFromDashboard(state);
    }
    default:
        return [];
    }
};

/*
 * Get resource type and data for state update in sync process
 * @param {String} appType geostory or dashboard
 * @param {Object} resourceData Resource Object
 * @param {Array} successArr Array of success responses only used in case of dashboard
 * @returns {Object}
 */
const getSyncInfo = (appType, resourceData, successArr = []) => {

    if (appType === 'geostory') {
        const type = resourceData.subtype || resourceData.resource_type;
        const data = type !== 'map' ? parseDocumentConfig(resourceData, resourceData) : parseMapConfig(resourceData);
        return { type, data };
    }
    if (appType === 'dashboard') {
        const updatedWidgets = resourceData.widgets?.map((widget) => {

            if (widget.widgetType === 'map' && widget.maps) {
                return {
                    ...widget,
                    maps: widget.maps.map((map) => {
                        const currentMapResource = successArr.find(res => !!(res.data.pk === map?.extraParams?.pk));
                        if (currentMapResource) {
                            return { ...map, ...currentMapResource.data.data.map };
                        }
                        return map;
                    })
                };
            }

            const currentWidget = successArr.find(res => !!(res.data.pk === widget.map?.extraParams?.pk));
            if (currentWidget) {
                return { ...widget, map: { ...widget.map, ...currentWidget.data.data.map } };
            }

            return widget;
        });
        return { data: merge(resourceData, { widgets: updatedWidgets }) };
    }

    return {};
};

/*
 * Get notification title, leve, and message for showNotification
 * @param {Number} errors length of errors array
 * @param {Number} successes length of success arra
 * @returns {Object}
 */
const getNotificationInfo = (errors, successes, resourceType) => {
    let verdict = 'Success';
    if (errors > 0 && successes > 0) verdict = 'Warning';
    else if (errors === 0 && successes > 0) verdict = 'Success';
    else if (errors > 0 && successes === 0) verdict = 'Error';

    return {level: verdict.toLowerCase(), title: `gnviewer.sync${verdict}${verdict !== 'Warning' ? resourceType : ''}Title`, message: `gnviewer.sync${verdict}Message`};
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
        const maps = uniq(resources.maps || []);
        const documents = uniq(resources.documents || []);
        return Observable.defer(() =>
            axios.all([
                maps.length > 0
                    ? getMapsByPk(maps)
                        .then((mapsResources) => mapsResources)
                        .catch(() => [])
                    : Promise.resolve([]),
                documents.length > 0
                    ? getDocumentsByPk(documents)
                        .then((documentResources) => documentResources)
                        .catch(() => [])
                    : Promise.resolve([])
            ]).then(([mapsResources, documentResources]) => {
                return [
                    ...maps.map(pk => {
                        const data = mapsResources.find(map => map.pk === pk);
                        return data
                            ? { data, status: 'success', title: data.title }
                            : { status: 'error', title: `map/${pk}` };
                    }),
                    ...documents.map(pk => {
                        const data = documentResources.find(document => document.pk === pk);
                        return data
                            ? { data, status: 'success', title: data.title }
                            : { status: 'error', title: `document/${pk}` };
                    })
                ];
            }))
            .switchMap(updatedResources => {

                const errorsResponses = updatedResources.filter(({ status }) => status === 'error');
                const successResponses = updatedResources.filter(({ status }) => status === 'success');

                const getUpdateActions = () => {
                    if (successResponses.length === 0) {
                        return [];
                    }
                    if (resourceType === 'geostory') {
                        return successResponses.map(({ data }) => {
                            const { type, data: updatedData } = getSyncInfo('geostory', data);
                            return editResource(data.pk, type, updatedData);
                        });
                    }
                    if (resourceType === 'dashboard') {
                        const originalData = originalDataSelector(state);
                        const { data: newResourceData } = getSyncInfo('dashboard', originalData, successResponses);
                        return [dashboardLoaded(dashboardResource(state), newResourceData)];
                    }
                    return [];
                };

                const updateActions = getUpdateActions();

                // notification action into
                const {level, title, message} = getNotificationInfo(errorsResponses.length, successResponses.length, resourceType);

                return Observable.of(
                    ...updateActions,
                    saveSuccess(),
                    showNotification({
                        title,
                        message,
                        values: {
                            successTitles: successResponses.map((response) => response.title)?.join(', '),
                            errorTitles: errorsResponses.map((resource) => resource.title)?.join(', ')
                        }
                    }, level)
                );
            }).catch((error) => {
                return Observable.of(
                    saveSuccess(),
                    errorNotification({ title: "gnviewer.syncErrorTitle", message: error?.data?.detail || error?.originalError?.message || error?.message || "gnviewer.syncErrorDefault" })
                );
            }).startWith(savingResource());
    });


export default {
    gnSyncComponentsWithResources
};
