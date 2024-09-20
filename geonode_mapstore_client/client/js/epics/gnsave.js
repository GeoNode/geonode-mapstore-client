/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import { Observable } from 'rxjs';
import get from 'lodash/get';
import { mapInfoSelector } from '@mapstore/framework/selectors/map';
import { userSelector } from '@mapstore/framework/selectors/security';
import {
    error as errorNotification,
    success as successNotification,
    warning as warningNotification
} from '@mapstore/framework/actions/notifications';
import {
    SAVE_CONTENT,
    saveSuccess,
    saveError,
    savingResource,
    SAVE_DIRECT_CONTENT,
    clearSave,
    saveContent
} from '@js/actions/gnsave';
import {
    setResource,
    SET_MAP_THUMBNAIL,
    resetGeoLimits,
    setResourceCompactPermissions,
    updateResourceProperties,
    loadingResourceConfig,
    enableMapThumbnailViewer,
    updateResource,
    manageLinkedResource
} from '@js/actions/gnresource';
import {
    getResourceByPk,
    updateDataset,
    createGeoApp,
    updateGeoApp,
    createMap,
    updateMap,
    updateDocument,
    setMapThumbnail,
    updateCompactPermissionsByPk,
    getResourceByUuid
} from '@js/api/geonode/v2';
import { parseDevHostname } from '@js/utils/APIUtils';
import uuid from 'uuid';
import {
    getResourceName,
    getResourceDescription,
    getPermissionsPayload,
    getResourceData,
    getResourceId,
    getDataPayload,
    getCompactPermissions,
    getExtentPayload
} from '@js/selectors/resource';

import {
    updateGeoLimits,
    deleteGeoLimits
} from '@js/api/geonode/security';
import {
    STOP_ASYNC_PROCESS,
    startAsyncProcess
} from '@js/actions/resourceservice';
import {
    ResourceTypes,
    cleanCompactPermissions,
    toGeoNodeMapConfig,
    RESOURCE_MANAGEMENT_PROPERTIES
} from '@js/utils/ResourceUtils';
import {
    ProcessTypes,
    ProcessStatus
} from '@js/utils/ResourceServiceUtils';

const RESOURCE_MANAGEMENT_PROPERTIES_KEYS = Object.keys(RESOURCE_MANAGEMENT_PROPERTIES);

function parseMapBody(body) {
    const geoNodeMap = toGeoNodeMapConfig(body.data);
    return {
        ...body,
        ...geoNodeMap
    };
}

const SaveAPI = {
    [ResourceTypes.MAP]: (state, id, body) => {
        return id
            ? updateMap(id, { ...parseMapBody(body), id })
            : createMap(parseMapBody(body));
    },
    [ResourceTypes.GEOSTORY]: (state, id, body) => {
        const user = userSelector(state);
        return id
            ? updateGeoApp(id, body)
            : createGeoApp({
                'name': body.title + ' ' + uuid(),
                'owner': user.name,
                'resource_type': ResourceTypes.GEOSTORY,
                ...body
            });
    },
    [ResourceTypes.DASHBOARD]: (state, id, body) => {
        const user = userSelector(state);
        return id
            ? updateGeoApp(id, body)
            : createGeoApp({
                'name': body.title + ' ' + uuid(),
                'owner': user.name,
                'resource_type': ResourceTypes.DASHBOARD,
                ...body
            });
    },
    [ResourceTypes.DOCUMENT]: (state, id, body) => {
        return id ? updateDocument(id, body) : false;
    },
    [ResourceTypes.DATASET]: (state, id, body) => {
        return id ? updateDataset(id, body) : false;
    },
    [ResourceTypes.VIEWER]: (state, id, body) => {
        const user = userSelector(state);
        return id
            ? updateGeoApp(id, body)
            : createGeoApp({
                'name': body.title + ' ' + uuid(),
                'owner': user.name,
                'resource_type': ResourceTypes.VIEWER,
                'advertised': false,
                ...body
            });
    }
};

export const gnSaveContent = (action$, store) =>
    action$.ofType(SAVE_CONTENT)
        .switchMap((action) => {
            const state = store.getState();
            const contentType = state.gnresource?.type || 'map';
            const data = getDataPayload(state, contentType);
            const extent = getExtentPayload(state, contentType);
            const currentResource = getResourceData(state);
            const body = {
                'title': action.metadata.name,
                ...(RESOURCE_MANAGEMENT_PROPERTIES_KEYS.reduce((acc, key) => {
                    acc[key] = !!currentResource?.[key];
                    return acc;
                }, {})),
                ...(action.metadata.description && { 'abstract': action.metadata.description }),
                ...(data && { 'data': JSON.parse(JSON.stringify(data)) }),
                ...(extent && { extent })
            };
            return Observable.defer(() => SaveAPI[contentType](state, action.id, body, action.reload))
                .switchMap((resource) => {
                    if (action.reload) {
                        if (contentType === ResourceTypes.VIEWER) {
                            const sourcepk = get(state, 'router.location.pathname', '').split('/').pop();
                            return Observable.of(manageLinkedResource({resourceType: contentType, source: sourcepk, target: resource.pk, processType: ProcessTypes.LINK_RESOURCE}));
                        }
                        window.location.href = parseDevHostname(resource?.detail_url);
                        window.location.reload();
                        return Observable.empty();
                    }
                    return Observable.of(
                        saveSuccess(resource),
                        setResource({
                            ...currentResource,
                            ...body,
                            ...resource
                        }),
                        updateResource(resource),
                        ...(action.showNotifications
                            ? [
                                action.showNotifications === true
                                    ? successNotification({title: "saveDialog.saveSuccessTitle", message: "saveDialog.saveSuccessMessage"})
                                    : warningNotification(action.showNotifications)
                            ]
                            : [])
                    );
                })
                .catch((error) => {
                    return Observable.of(
                        saveError(error.data || error.message),
                        ...(action.showNotifications
                            ? [errorNotification({title: "map.mapError.errorTitle", message: "map.mapError.errorDefault"})]
                            : [])
                    );
                })
                .startWith(savingResource());

        });
export const gnSetMapThumbnail = (action$, store) =>
    action$.ofType(SET_MAP_THUMBNAIL)
        .switchMap((action) => {

            const state = store.getState();
            const contentType = state.gnresource?.data?.resource_type || 'map';
            const resourceIDThumbnail = state?.gnresource?.id;
            const currentResource = state.gnresource?.data || {};

            const body = {
                srid: action.bbox.crs,
                bbox: [ Object.values(action.bbox.bounds)[2],
                    Object.values(action.bbox.bounds)[0],
                    Object.values(action.bbox.bounds)[3],
                    Object.values(action.bbox.bounds)[1]
                ]
            };

            return Observable.defer(() => setMapThumbnail(resourceIDThumbnail, body, contentType))
                .switchMap((res) => {
                    const randomNumber = Math.random();
                    return Observable.of(
                        updateResourceProperties({ ...currentResource, thumbnail_url: `${res.thumbnail_url}?${randomNumber}` }),
                        enableMapThumbnailViewer(false), updateResource({ ...currentResource, thumbnail_url: `${res.thumbnail_url}?${randomNumber}` }),
                        clearSave(),
                        ...([successNotification({ title: "gnviewer.thumbnailsaved", message: "gnviewer.thumbnailsaved" })])

                    );
                })
                .catch((error) => {
                    return Observable.of(
                        saveError(error.data),
                        errorNotification({ title: "gnviewer.thumbnailnotsaved", message: "gnviewer.thumbnailnotsaved" })
                    );
                });
        });
export const gnSaveDirectContent = (action$, store) =>
    action$.ofType(SAVE_DIRECT_CONTENT)
        .switchMap(() => {
            const state = store.getState();
            const mapInfo = mapInfoSelector(state);
            const resourceId = mapInfo?.id || getResourceId(state);
            const { compactPermissions, geoLimits } = getPermissionsPayload(state);
            const currentResource = getResourceData(state);

            return Observable.defer(() => axios.all([
                getResourceByPk(resourceId),
                ...(geoLimits
                    ? geoLimits.map((limits) =>
                        limits.features.length === 0
                            ? deleteGeoLimits(resourceId, limits.id, limits.type)
                                .catch(() => ({ error: true, resourceId, limits }))
                            : updateGeoLimits(resourceId, limits.id, limits.type, { features: limits.features })
                                .catch(() => ({ error: true, resourceId, limits }))
                    )
                    : [])
            ]))
                .switchMap(([resource, ...geoLimitsResponses]) => {
                    const geoLimitsErrors = geoLimitsResponses.filter(({ error }) => error);
                    const name = getResourceName(state);
                    const description = getResourceDescription(state);
                    const metadata = {
                        name: (name) ? name : resource?.title,
                        description: (description) ? description : resource?.abstract,
                        extension: resource?.extension,
                        href: resource?.href
                    };
                    return Observable.concat(
                        ...(compactPermissions ? [
                            Observable.defer(() =>
                                updateCompactPermissionsByPk(resourceId, cleanCompactPermissions(compactPermissions))
                                    .then(output => ({ resource: currentResource, output, processType: ProcessTypes.PERMISSIONS_RESOURCE }))
                                    .catch((error) => ({ resource: currentResource, error: error?.data?.detail || error?.statusText || error?.message || true, processType: ProcessTypes.PERMISSIONS_RESOURCE }))
                            )
                                .switchMap((payload) => {
                                    return Observable.of(startAsyncProcess(payload));
                                })
                        ] : []),
                        Observable.of(
                            saveContent(
                                resourceId,
                                metadata,
                                false,
                                geoLimitsErrors.length > 0
                                    ? {
                                        title: 'gnviewer.warningGeoLimitsSaveTitle',
                                        message: 'gnviewer.warningGeoLimitsSaveMessage'
                                    }
                                    : true /* showNotification */),
                            resetGeoLimits()
                        )
                    );
                })
                .catch((error) => {
                    return Observable.of(
                        saveError(error.data || error.message),
                        errorNotification({title: "map.mapError.errorTitle", message: error?.data?.detail || error?.message || "map.mapError.errorDefault"})
                    );
                })
                .startWith(savingResource());
        });

export const gnWatchStopPermissionsProcess = (action$, store) =>
    action$.ofType(STOP_ASYNC_PROCESS)
        .filter(action => action?.payload?.processType === ProcessTypes.PERMISSIONS_RESOURCE)
        .switchMap((action) => {
            const state = store.getState();
            const resourceId = getResourceId(state);
            if (resourceId !== action?.payload?.resource?.pk) {
                return Observable.empty();
            }
            const isError = action?.payload?.error || action?.payload?.output?.status === ProcessStatus.FAILED;
            if (isError) {
                return Observable.of(errorNotification({
                    title: 'gnviewer.errorCompactPermissionsTitle',
                    message: 'gnviewer.errorCompactPermissionsMessage'
                }));
            }
            // reset permission to remove pending changes
            const compactPermissions = getCompactPermissions(state);
            return Observable.of(setResourceCompactPermissions(compactPermissions));
        });

export const gnWatchStopCopyProcessOnSave = (action$, store) =>
    action$.ofType(STOP_ASYNC_PROCESS)
        .filter(action => action?.payload?.processType === ProcessTypes.COPY_RESOURCE)
        .switchMap((action) => {
            const state = store.getState();
            const resourceId = getResourceId(state);
            const pathname = state?.router?.location?.pathname;
            if (resourceId !== action?.payload?.resource?.pk || pathname.includes('/detail/')) {
                return Observable.empty();
            }
            const isError = action?.payload?.error || action?.payload?.output?.status === ProcessStatus.FAILED;
            if (isError) {
                return Observable.empty();
            }
            const newResourceUuid = action?.payload?.output?.output_params?.output?.uuid;
            if (newResourceUuid === undefined) {
                return Observable.empty();
            }
            return Observable.defer(() => getResourceByUuid(newResourceUuid))
                .switchMap((resource) => {
                    window.location.href = parseDevHostname(resource?.detail_url);
                    return Observable.empty();
                })
                .startWith(loadingResourceConfig(true));
        });

export default {
    gnSaveContent,
    gnSaveDirectContent,
    gnSetMapThumbnail,
    gnWatchStopPermissionsProcess,
    gnWatchStopCopyProcessOnSave
};
