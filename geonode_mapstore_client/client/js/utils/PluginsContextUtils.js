/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    canAccessPermissions,
    canCopyResource,
    canManageResourceSettings,
    getCataloguePath,
    getMetadataDetailUrl,
    getMetadataUrl,
    isDocumentExternalSource,
    resourceHasPermission
} from "@js/utils/ResourceUtils";
import {
    getSupportedFilesByResourceType,
    getUploadMainFile,
    getUploadProperty
} from "@js/utils/UploadUtils";
import get from "lodash/get";
import { getEndpointUrl } from "@js/api/geonode/v2/constants";
import { isArray } from "lodash";

function getUserResourceName(user) {
    return user?.first_name !== "" && user?.last_name !== ""
        ? `${user?.first_name} ${user?.last_name}`
        : user?.username;
}

function getUserResourceNames(users = []) {
    if (!users) {
        return [];
    }

    const userArray = !isArray(users) ? [users] : users;
    return userArray.map((user) => {
        return {
            href: "/people/profile/" + user.username,
            value: getUserResourceName(user)
        };
    });
}

const getCreateNewMapLink = (resource) => {
    return `#/map/new?gn-dataset=${resource?.pk}:${resource?.subtype || ""}`;
};

export const getPluginsContext = () => ({
    get,
    getMetadataUrl,
    getMetadataDetailUrl,
    resourceHasPermission,
    canCopyResource,
    userHasPermission: (user, perm) => user?.perms?.includes(perm),
    getUserResourceName,
    getUserResourceNames,
    isDocumentExternalSource,
    getCataloguePath,
    getCreateNewMapLink,
    canManageResourceSettings,
    getUploadMainFile,
    getEndpointUrl,
    getSupportedFilesByResourceType,
    getUploadProperty,
    canAccessPermissions,
    canInteractResource: (isNew, resource, user) => {
        return !!(isNew
            || resourceHasPermission(resource, 'change_resourcebase')
            || canCopyResource(resource, user)
            || resourceHasPermission(resource, 'delete_resourcebase')
        );
    },
    canSaveResource: (isNew, resource, user) => {
        return !!(!isNew && (resourceHasPermission(resource, 'change_resourcebase') || canCopyResource(resource, user)));
    },
    canSaveAsResource: (isNew, resource, user) => {
        return !!(isNew
            || resourceHasPermission(resource, 'change_resourcebase')
            || canCopyResource(resource, user)
        );
    },
    canSaveAsDataset: (isNew, resource, user, layerPerms) => {
        const canSave = isNew || resourceHasPermission(resource, 'change_resourcebase') || canCopyResource(resource, user);
        const canDownload = layerPerms?.includes('download_resourcebase') && resourceHasPermission(resource, 'download_resourcebase');
        return !!(canSave && canDownload);
    },
    canShareResource: (isNew, resource) => {
        return !!(!isNew && canAccessPermissions(resource));
    },
    canEditResource: (isNew, resource) => {
        return !!(isNew || resourceHasPermission(resource, 'change_resourcebase'));
    },
    canEditExistingResource: (isNew, resource) => {
        return !!(!isNew && resourceHasPermission(resource, 'change_resourcebase'));
    },
    canDeleteResource: (isNew, resource) => !!(!isNew && resourceHasPermission(resource, 'delete_resourcebase')),
    canEditDatasetData: (resource) => !!resourceHasPermission(resource, 'change_dataset_data'),
    canEditDatasetStyle: (resource) => !!resourceHasPermission(resource, 'change_dataset_style'),
    canDownloadLayer: (layerPerms) => !!layerPerms?.includes('download_resourcebase'),
    canSaveDocument: (resource, user) => {
        return !!(resourceHasPermission(resource, 'change_resourcebase') || (canCopyResource(resource, user) && resourceHasPermission(resource, 'download_resourcebase')));
    },
    canManageDocument: (isNew, resource, user, layerPerms) => {
        return !!(
            resourceHasPermission(resource, 'change_resourcebase')
            || resourceHasPermission(resource, 'delete_resourcebase')
            || (canCopyResource(resource, user) && resourceHasPermission(resource, 'download_resourcebase') && (isNew || layerPerms?.includes('download_resourcebase')))
        );
    },
    canEditMapViewer: (params, linkedViewer) => !!(params?.appPk && resourceHasPermission(linkedViewer, 'change_resourcebase')),
    canRemoveMapViewer: (params, resource, linkedViewer) => {
        return !!(params?.appPk && resourceHasPermission(resource, 'delete_resourcebase') && resourceHasPermission(linkedViewer, 'delete_resourcebase'));
    },
    canAddResource: (user) => !!(user?.perms?.includes('add_resource')),
    canCreateResourceFromCatalog: (settings, user) => !!(!settings?.isMobile && user?.perms?.includes('add_resource')),
    canCreateLayer: (settings) => !!settings?.createLayer,
    isMobile: (browser) => !!browser?.mobile,
    hasData: (resource, layerPerms) => {
        const isValidSubtype = resource && !['raster', '3dtiles'].includes(resource.subtype);
        const hasPermission = layerPerms?.includes('download_resourcebase');
        return !!(isValidSubtype && hasPermission);
    },
    is3DTiles: (resource) => resource?.subtype === '3dtiles',
    getEditDataUrl: (resource) => `#/dataset/${resource?.pk || ''}/edit/data`,
    getEditStyleUrl: (resource) => `#/dataset/${resource?.pk || ''}/edit/settings?tab=style`,
    getEditSettingsUrl: (resource) => `#/dataset/${resource?.pk || ''}/edit/settings`,
    getDatasetUrl: (resource) => `#/dataset/${resource?.pk || ''}`,
    getNewMapViewerUrl: (resource) => `#/viewer/new/map/${resource?.pk || ''}`,
    getMapUrl: (params) => `#/map/${params?.mapPk || ''}`,
    getGoBackToLabel: (resource) => `< Go back to ${resource?.title || ''}`,
    getOwnerProfileUrl: (resource) => {
        const username = resource?.owner?.username;
        return username ? `/people/profile/${username}` : '';
    },
    getDateTypeLabelId: (resource) => {
        const dateType = resource?.date_type;
        return dateType ? `gnviewer.${dateType.toLowerCase()}` : 'gnviewer.date';
    },
    getDocumentSourceFieldType: (resource) => {
        const isExternal = isDocumentExternalSource(resource);
        return isExternal ? 'link' : 'text';
    },
    getExtentObject: (resource) => {
        return {
            extent: resource?.extent
        };
    },
    getResourceTypeLabelId: (resource) => {
        const resourceType = resource?.resource_type;
        return resourceType ? `gnviewer.${resourceType.toLowerCase()}` : 'gnviewer.resource';
    },
    getDashboardCatalogueServices: (settings) => {
        return settings?.dashboardCatalogueServices || {};
    },
    getProjectionDefsEndpoint: (settings = {}) => settings?.projectionDefsEndpoint || ''
});
