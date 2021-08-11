/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import turfBbox from '@turf/bbox';
import uuid from 'uuid';
import url from 'url';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { parseDevHostname } from '@js/utils/APIUtils';

function getExtentFromResource({ ll_bbox_polygon: llBboxPolygon }) {
    if (!llBboxPolygon) {
        return null;
    }
    const extent = turfBbox({
        type: 'Feature',
        properties: {},
        geometry: llBboxPolygon
    });
    const [minx, miny, maxx, maxy] = extent;
    const bbox = {
        crs: 'EPSG:4326',
        bounds: { minx, miny, maxx, maxy }
    };
    return bbox;
}

/**
* convert resource layer configuration to a mapstore layer object
* @memberof MenuUtils
* @param {object} resource geonode layer resource
* @return {object}
*/
export const resourceToLayerConfig = (resource) => {

    const {
        alternate,
        links = [],
        featureinfo_custom_template: template,
        title
    } = resource;

    const bbox = getExtentFromResource(resource);

    const { url: wfsUrl } = links.find(({ link_type: linkType }) => linkType === 'OGC:WFS') || {};
    const { url: wmsUrl } = links.find(({ link_type: linkType }) => linkType === 'OGC:WMS') || {};

    const format = getConfigProp('defaultLayerFormat') || 'image/png';
    return {
        perms: resource.perms,
        id: uuid(),
        pk: resource.pk,
        type: 'wms',
        name: alternate,
        url: wmsUrl,
        format,
        ...(wfsUrl && {
            search: {
                type: 'wfs',
                url: wfsUrl
            }
        }),
        ...(bbox && { bbox }),
        ...(template && {
            featureInfo: {
                format: 'TEMPLATE',
                template
            }
        }),
        style: '',
        title,
        visibility: true
    };
};

function updateUrlQueryParameter(requestUrl, query) {
    const parsedUrl = url.parse(requestUrl, true);
    return url.format({
        ...parsedUrl,
        query: {
            ...parsedUrl.query,
            ...query
        }
    });
}

export function resourceToPermissionEntry(type, resource) {
    if (type === 'user') {
        return {
            type: 'user',
            id: resource.id || resource.pk,
            avatar: resource.avatar,
            name: resource.username,
            permissions: resource.permissions
        };
    }
    return {
        type: 'group',
        id: resource.id || resource?.group?.pk,
        name: resource.title,
        avatar: resource.logo,
        permissions: resource.permissions
    };
}

export function permissionsListsToCompact({ groups, entries }) {
    return {
        groups: groups
            .filter(({ permissions }) => permissions)
            .map(({ type, ...properties }) => (properties)),
        organizations: entries
            .filter(({ permissions, type }) => permissions && type === 'group')
            .map(({ type, ...properties }) => (properties)),
        users: entries
            .filter(({ permissions, type }) => permissions && type === 'user')
            .map(({ type, ...properties }) => (properties))
    };
}

export function permissionsCompactToLists({ groups, users, organizations }) {
    return {
        groups: [
            ...(groups || []).map((entry) => ({ ...entry, type: 'group', name: entry.name, avatar: entry.logo }))
        ],
        entries: [
            ...(users || []).map((entry) => ({ ...entry, type: 'user', name: entry.username, avatar: entry.avatar })),
            ...(organizations || []).map((entry) => ({ ...entry, type: 'group', name: entry.title, avatar: entry.logo }))
        ]
    };
}

export function cleanCompactPermissions({ groups, users, organizations }) {
    return {
        groups: groups
            .map(({ id, permissions }) => ({ id, permissions }))
            .sort((a, b) => a.id > b.id ? -1 : 1),
        organizations: organizations
            .map(({ id, permissions }) => ({ id, permissions }))
            .sort((a, b) => a.id > b.id ? -1 : 1),
        users: users
            .map(({ id, permissions }) => ({ id, permissions }))
            .sort((a, b) => a.id > b.id ? -1 : 1)
    };
}

export function getGeoLimitsFromCompactPermissions({ groups = [], users = [], organizations = [] }) {
    const entries = [
        ...users
            .filter(({ isGeoLimitsChanged }) => isGeoLimitsChanged)
            .map(({ id, features }) => ({ id, features, type: 'user' })),
        ...[...groups, ...organizations]
            .filter(({ isGeoLimitsChanged }) => isGeoLimitsChanged)
            .map(({ id, features }) => ({ id, features, type: 'group' }))
    ];
    return entries;
}

export const ResourceTypes = {
    DATASET: 'dataset',
    MAP: 'map',
    DOCUMENT: 'document',
    GEOSTORY: 'geostory',
    DASHBOARD: 'dashboard'
};

export const getResourceTypesInfo = () => ({
    [ResourceTypes.DATASET]: {
        icon: 'database',
        formatEmbedUrl: (resource) => parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'layer_preview',
            theme: 'preview'
        })),
        formatDetailUrl: (resource) => (`/catalogue/#/dataset/${resource.pk}`),
        name: 'Dataset',
        formatMetadataUrl: (resource) => (`/datasets/${resource.alternate}/metadata`)
    },
    [ResourceTypes.MAP]: {
        icon: 'map',
        name: 'Map',
        formatEmbedUrl: (resource) => parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'map_preview',
            theme: 'preview'
        })),
        formatDetailUrl: (resource) => (`/catalogue/#/map/${resource.pk}`),
        formatMetadataUrl: (resource) => (`/maps/${resource.pk}/metadata`)
    },
    [ResourceTypes.DOCUMENT]: {
        icon: 'file',
        name: 'Document',
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => (`/catalogue/#/document/${resource.pk}`),
        formatMetadataUrl: (resource) => (`/documents/${resource.pk}/metadata`)
    },
    [ResourceTypes.GEOSTORY]: {
        icon: 'book',
        name: 'GeoStory',
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => (`/catalogue/#/geostory/${resource.pk}`),
        formatMetadataUrl: (resource) => (`/apps/${resource.pk}/metadata`)
    },
    [ResourceTypes.DASHBOARD]: {
        icon: 'dashboard',
        name: 'Dashboard',
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => (`/catalogue/#/dashboard/${resource.pk}`),
        formatMetadataUrl: (resource) => (`/apps/${resource.pk}/metadata`)
    }
});

export const getMetadataUrl = (resource) => {
    if (resource) {
        const { formatMetadataUrl = () => '' } = getResourceTypesInfo()[resource?.resource_type] || {};
        return formatMetadataUrl(resource);
    }
    return '';
};
