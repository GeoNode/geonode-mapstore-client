/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    getMetadataUrl,
    getMetadataDetailUrl,
    resourceHasPermission,
    canCopyResource,
    isDocumentExternalSource,
    getCataloguePath
} from '@js/utils/ResourceUtils';
import get from 'lodash/get';
import isNil from 'lodash/isNil';

function getUserResourceName(user) {
    return user?.first_name !== '' && user?.last_name !== ''
        ? `${user?.first_name} ${user?.last_name}`
        : user?.username;
}

function getUserResourceNames(users = []) {
    if (!users) {
        return [];
    }

    const userArray = !Array.isArray(users) ? [users] : users;
    return userArray.map((user) => {
        return {
            href: '/messages/create/' + user.pk,
            value: getUserResourceName(user)
        };
    });
}

const getCreateNewMapLink = (resource) => {
    return `#/map/new?gn-dataset=${resource?.pk}:${resource?.subtype || ''}`;
};

const hasDefaultSettings = (layer) => {
    if (layer?.type === 'wms' && !isNil(layer?.extendedParams?.pk)) {
        return false;
    }
    return true;
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
    hasDefaultSettings,
    canSaveResource: (isNew, resource, user) => {
        return !!(!isNew && (resourceHasPermission(resource, 'change_resourcebase') || canCopyResource(resource, user)));
    },
    canSaveAsResource: (isNew, resource, user) => {
        return !!(isNew || resourceHasPermission(resource, 'change_resourcebase') || canCopyResource(resource, user));
    },
    canSaveAsDataset: (isNew, resource, user, layerPerms) => {
        const canSave = isNew || resourceHasPermission(resource, 'change_resourcebase') || canCopyResource(resource, user);
        const canDownload = layerPerms?.includes('download_resourcebase') && resourceHasPermission(resource, 'download_resourcebase');
        return !!(canSave && canDownload);
    },
    canEditResource: (isNew, resource) => {
        return !!(isNew || resourceHasPermission(resource, 'change_resourcebase'));
    },
    canEditExistingResource: (isNew, resource) => {
        return !!(!isNew && resourceHasPermission(resource, 'change_resourcebase'));
    },
    canDeleteResource: (isNew, resource) => {
        return !!(!isNew && resourceHasPermission(resource, 'delete_resourcebase'));
    },
    canEditDatasetData: (resource) => !!resourceHasPermission(resource, 'change_dataset_data'),
    canEditDatasetStyle: (resource) => !!resourceHasPermission(resource, 'change_dataset_style'),
    canDownloadLayer: (layerPerms) => !!layerPerms?.includes('download_resourcebase'),
    canDownloadLayerOrExternal: (layerPerms, resource) => {
        return !!(layerPerms?.includes('download_resourcebase') && !isDocumentExternalSource(resource));
    },
    canEditMapViewer: (params, linkedViewer) => !!(params?.appPk && resourceHasPermission(linkedViewer, 'change_resourcebase')),
    canRemoveMapViewer: (params, resource, linkedViewer) => {
        return !!(params?.appPk && resourceHasPermission(resource, 'delete_resourcebase') && resourceHasPermission(linkedViewer, 'delete_resourcebase'));
    },
    canAddResource: (user) => !!(user?.perms?.includes('add_resource')),
    canCreateResourceFromCatalog: (settings, user) => !!(!settings?.isMobile && user?.perms?.includes('add_resource')),
    canCreateLayer: (settings) => !!settings?.createLayer,
    isDataset: (resource) => resource?.resource_type === 'dataset',
    isRasterRemoteOr3DTiles: (resource) => !!(resource && ['raster', 'remote', '3dtiles'].includes(resource.subtype)),
    is3DTiles: (resource) => resource?.subtype === '3dtiles',
    hasLinkedMap: (params) => !!params?.mapPk,
    getDynamicLabelId: (prefix, value, fallback = '') => {
        if (value && typeof value === 'string') {
            return `${prefix}${value.toLowerCase()}`;
        }
        return fallback || prefix;
    },
    getDocumentSourceFieldType: (resource) => {
        return isDocumentExternalSource(resource) ? 'link' : 'text';
    },
    getSourceType: (resource) => {
        const sourceType = resource?.sourcetype || '';
        return sourceType.toLowerCase();
    },
    getLocationsObject: (resourceData, initialData) => {
        return {
            extent: resourceData?.extent,
            initialExtent: initialData?.extent
        };
    },
    getEditDataUrl: (resource) => `#/dataset/${resource?.pk || ''}/edit/data`,
    getEditStyleUrl: (resource) => `#/dataset/${resource?.pk || ''}/edit/style`,
    getDatasetUrl: (resource) => `#/dataset/${resource?.pk || ''}`,
    getStyleUploadUrl: (resource) => `/datasets/${resource?.alternate || ''}/style_upload`,
    getMetadataUploadUrl: (resource) => `/datasets/${resource?.alternate || ''}/metadata_upload`,
    getOwnerProfileUrl: (resource) => resource?.owner?.username ? `/people/profile/${resource.owner.username}` : '',
    getMapUrl: (params) => `#/map/${params?.mapPk || ''}`,
    getNewMapViewerUrl: (resource) => `#/viewer/new/map/${resource?.pk || ''}`,
    getGeoServerUrl: (settings) => settings?.geoserverUrl || '/geoserver/',
    getGeoNodeGsUrl: (settings) => settings?.geonodeUrl ? `${settings.geonodeUrl}gs/` : '/gs/',
    getGeoServerWfsUrl: (settings) => {
        const baseUrl = settings?.geoserverUrl || '/geoserver/';
        return baseUrl.endsWith('/') ? `${baseUrl}wfs` : `${baseUrl}/wfs`;
    },
    getDashboardSelectedService: (settings) => settings?.dashboardCatalogueSelectedService || '',
    getDashboardServices: (settings) => settings?.dashboardCatalogueServices || {},
    isMobile: (browser) => !!browser?.mobile,
    hasLinkedViewer: (params) => !!params?.appPk
});
