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
import {
    getUploadMainFile,
    getSupportedFilesByResourceType,
    getUploadProperty
} from '@js/utils/UploadUtils';
import get from 'lodash/get';
import { getEndpointUrl } from '@js/api/geonode/v2/constants';

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

const canManageResourceSettings = (resource) => {
    const { perms } = resource || {};
    const settingsPerms = ['feature_resourcebase', 'approve_resourcebase', 'publish_resourcebase'];
    return !!(perms || []).find(perm => settingsPerms.includes(perm));
};

const canAccessPermissions = (resource) => {
    const { perms } = resource || {};
    return perms?.includes('change_resourcebase_permissions');
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
    canAccessPermissions
});
