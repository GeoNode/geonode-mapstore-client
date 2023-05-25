/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mapSelector } from '@mapstore/framework/selectors/map';
import { mapSaveSelector } from '@js/selectors/mapsave';
import { compareMapChanges } from '@mapstore/framework/utils/MapUtils';
import { currentStorySelector } from '@mapstore/framework/selectors/geostory';
import { originalDataSelector } from '@mapstore/framework/selectors/dashboard';
import { widgetsConfig } from '@mapstore/framework/selectors/widgets';
import { ResourceTypes } from '@js/utils/ResourceUtils';
import {
    getCurrentResourceDeleteLoading,
    getCurrentResourceCopyLoading
} from '@js/selectors/resourceservice';
import omit from 'lodash/omit';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

/**
* @module selectors/resource
*/

export const getResourceId = (state) => {
    const resourceId = state?.gnresource?.id;
    const resourcePk = state?.gnresource?.data?.pk;
    return resourceId || resourcePk;
};

export const getResourcePerms = (state) => {
    return state?.gnresource?.data?.perms || [];
};

export const getResourceName = (state) => {
    return state?.gnresource?.data?.title || false;
};

export const getResourceDescription = (state) => {
    return state?.gnresource?.data?.abstract || false;
};

export const getResourceThumbnail = (state) => {
    return state?.gnresource?.data?.thumbnail_url || false;
};

export const updatingThumbnailResource = (state) => {
    return state?.gnresource?.data?.updatingThumbnail || false;
};

export const isThumbnailChanged = (state) => {
    return state?.gnresource?.data?.thumbnailChanged || false;
};

export const getViewedResourceType = (state) => {
    const viewedResourceType = state?.gnresource?.type || false;
    return viewedResourceType;
};

export const canEditResource = (state) => {
    const canEdit = state?.gnresource?.permissions?.canEdit;
    const perms = state?.gnresource?.data?.perms || [];
    return canEdit || perms.includes('change_resourcebase');
};

export const canViewResource = (state) => {
    const canView = state?.gnresource?.permissions?.canView;
    const perms = state?.gnresource?.data?.perms || [];
    return canView || perms.includes('view_resourcebase');
};

export const canAddResource = (state) => {
    return state?.security?.user?.perms?.includes("add_resource");
};

export const isNewResource = (state) => {
    return !!state?.gnresource?.isNew;
};

export const getResourceData = (state) => {
    return state?.gnresource?.data;
};

export const getCompactPermissions = (state) => {
    const compactPermissions = state?.gnresource?.compactPermissions || {};
    return compactPermissions;
};

export const getPermissionsPayload = (state) => {
    const compactPermissions = state?.gnresource?.compactPermissions;
    const isCompactPermissionsChanged = state?.gnresource?.isCompactPermissionsChanged;
    const geoLimits = state?.gnresource?.geoLimits;
    return {
        compactPermissions: (isCompactPermissionsChanged || geoLimits?.length > 0) && compactPermissions ? compactPermissions : null,
        geoLimits: geoLimits?.length > 0 ? geoLimits : null
    };
};

const inheritsPerms = (user = null, groups = []) => {
    return user && groups.some(group => user.info.groups.some(userGroup => userGroup === group.name) && group.permissions === 'manage') || false;
};

export const canEditPermissions = (state) => {
    const compactPermissions = getCompactPermissions(state);
    const users = compactPermissions.users || [];
    const groups = compactPermissions.groups || [];
    const organizations = compactPermissions.organizations || [];
    const user = state?.security?.user;
    const { permissions } = user && users.find(({ id }) => id === user.pk) || {};
    return ['owner', 'manage'].includes(permissions) || inheritsPerms(user, groups) || inheritsPerms(user, organizations);
};

export const getSelectedLayerPermissions = (state) => {
    const selectedLayerPermissions = state?.gnresource?.selectedLayerPermissions;
    return selectedLayerPermissions;
};

export const getDataPayload = (state, resourceType) => {
    const type = resourceType || state?.gnresource?.type;
    switch (type) {
    case ResourceTypes.MAP: {
        const isMapAvailable = !!mapSelector(state);
        return isMapAvailable ? mapSaveSelector(state) : null;
    }
    case ResourceTypes.GEOSTORY: {
        return currentStorySelector(state);
    }
    case ResourceTypes.DASHBOARD: {
        return widgetsConfig(state);
    }
    default:
        return null;
    }
};

function removeProperty(value, paths) {
    if (isArray(value)) {
        return value.map(val => removeProperty(val, paths));
    }
    if (isObject(value)) {
        return Object.keys(omit(value, paths))
            .reduce((acc, key) => ({
                ...acc,
                [key]: removeProperty(value[key], paths)
            }), {});
    }
    return value;
}

function isMapCenterEqual(initialCenter = {}, currentCenter = {}) {
    const CENTER_EPS = 1e-12;
    return initialCenter.crs === currentCenter.crs && Math.abs(initialCenter.x - currentCenter.x) < CENTER_EPS && Math.abs(initialCenter.y - currentCenter.y) < CENTER_EPS;
}

function isResourceDataEqual(state, initialData = {}, currentData = {}) {
    const resourceType = state?.gnresource?.type;
    if (isEmpty(initialData) || isEmpty(currentData)) {
        return true;
    }
    switch (resourceType) {
    case ResourceTypes.MAP: {
        return compareMapChanges(
            removeProperty(initialData, ['extraParams', 'getFeatureInfo', 'store', 'capability', 'extendedParams', 'availableStyles', 'center', 'zoom', 'bbox']),
            removeProperty(currentData, ['extraParams', 'getFeatureInfo', 'store', 'capability', 'extendedParams', 'availableStyles', 'center', 'zoom', 'bbox'])
        );
    }
    case ResourceTypes.GEOSTORY: {
        return isEqual(
            removeProperty(initialData, ['fontFamilies']),
            removeProperty(currentData, ['fontFamilies'])
        );
    }
    case ResourceTypes.DASHBOARD: {
        const initialWidgets = (initialData?.widgets || []);

        // check if the current dashboard was built after mapstore update
        // the mapstore submodule update introduces breaking changes which must be catered for
        // If the dashboard was created with the new features from mapstore, it supports multiple map widgets
        const supportsMultipleWidgets = initialWidgets.every((widget) => {
            if (widget.widgetType === 'map') {
                return !!widget.maps;
            }
            return true;
        });
        const isWidgetMapCenterChanged = !!(currentData?.widgets || [])
            .find((widget) => {
                if (widget.widgetType === 'map') {
                    const initialWidget = initialWidgets.find(({ id }) => id === widget.id);
                    const currentWidgets = [...widget.maps];
                    const allCentresEqual = supportsMultipleWidgets ? currentWidgets.every((mapWidget) => {
                        const relatedWidget = initialWidget?.maps?.find(w => w.mapId === mapWidget.mapId) || {};
                        return isMapCenterEqual(relatedWidget?.center, mapWidget?.center);
                    }) : isMapCenterEqual(initialWidget?.map?.center, currentWidgets[0].center);
                    return initialWidget ? !allCentresEqual : true;
                }
                return false;
            });
        const newCurrentData = supportsMultipleWidgets ? currentData : {
            ...currentData,
            widgets: currentData.widgets.map(widget => {
                if (!!widget.maps) {
                    const mapList = widget.maps;
                    delete widget.maps;
                    widget.map = mapList[0];
                }
                return widget;
            })
        };
        const initialListItemsToRemove = ['bbox', 'size', 'center', 'layouts'];
        const currentListItemsToRemove = !supportsMultipleWidgets ? ['bbox', 'size', 'center', 'layouts', 'mapId', 'dependenciesMap', 'selectedMapId'] : initialListItemsToRemove;
        return isEqual(
            removeProperty(initialData, initialListItemsToRemove),
            removeProperty(newCurrentData, currentListItemsToRemove)
        ) && !isWidgetMapCenterChanged;
    }
    default:
        return true;
    }
}

export const getResourceDirtyState = (state) => {
    const canEdit = canEditPermissions(state);
    const isDeleting = getCurrentResourceDeleteLoading(state);
    const isCopying = getCurrentResourceCopyLoading(state);
    if (!canEdit || isDeleting || isCopying) {
        return null;
    }
    const resourceType = state?.gnresource?.type;
    const metadataKeys = ['title', 'abstract', 'data'];
    const { data: initialData = {}, ...resource } = pick(state?.gnresource?.initialResource || {}, metadataKeys);
    const { compactPermissions, geoLimits } = getPermissionsPayload(state);
    const currentData = JSON.parse(JSON.stringify(getDataPayload(state) || {})); // JSON stringify is needed to remove undefined values
    // omitting data on thumbnail
    const thumbnailData = ['thumbnail_url', 'thumbnailChanged', 'updatingThumbnail'];
    const newMetadata = omit(state?.gnresource?.data, thumbnailData) || {};
    const newResource = pick(newMetadata, metadataKeys);
    const isDataChanged = !isResourceDataEqual(state, initialData, currentData);
    const isMetadataChanged = !!(!isEmpty(newResource) && !isEmpty(resource) && !isEqual(newResource, resource));

    return (!!compactPermissions || !!geoLimits || isDataChanged || isMetadataChanged)
        ? {
            compactPermissions,
            geoLimits,
            resource: isMetadataChanged ? newMetadata : undefined,
            data: isDataChanged ? currentData : undefined,
            resourceType,
            pk: newMetadata.pk
        }
        : null;
};

/**
 * Get geonode resources from within a Geostory
 * @param {Object} state App state
 * @returns {Array} Array of geonode resources
 */
export const getGeoNodeResourceDataFromGeoStory = (state) => get(currentStorySelector(state), 'resources', [])
    .filter(res => res?.data?.sourceId === 'geonode')
    .reduce((acc, resource) => {
        if (['image', 'video'].includes(resource.type) && resource.id) {
            return { ...acc, documents: [...acc.documents, resource.id] };
        }
        if (resource.type === 'map' && resource.id) {
            return { ...acc, maps: [...acc.maps, resource.id] };
        }
        return acc;
    }, { maps: [], documents: [] });

export const getGeoNodeResourceFromDashboard = (state) => get(originalDataSelector(state), 'widgets', [])
    .reduce((acc, { maps, ...widget }) => {
        if (maps && widget.widgetType === 'map') {
            return {
                ...acc,
                maps: [
                    ...acc.maps,
                    ...maps
                        .filter((map) => !!map?.extraParams?.pk)
                        .map((map) => map.extraParams.pk)
                ]
            };
        }
        if (widget.widgetType === 'map' && widget.map?.extraParams?.pk) {
            return {
                ...acc,
                maps: [ ...acc.maps, widget.map?.extraParams?.pk ]
            };
        }
        return acc;
    }, { maps: [] });
