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
import { ProcessTypes, ProcessStatus } from '@js/utils/ResourceServiceUtils';

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

const GXP_PTYPES = {
    'AUTO': 'gxp_wmscsource',
    'OWS': 'gxp_wmscsource',
    'WMS': 'gxp_wmscsource',
    'WFS': 'gxp_wmscsource',
    'WCS': 'gxp_wmscsource',
    'REST_MAP': 'gxp_arcrestsource',
    'REST_IMG': 'gxp_arcrestsource',
    'HGL': 'gxp_hglsource',
    'GN_WMS': 'gxp_geonodecataloguesource'
};

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
        title,
        perms,
        pk,
        has_time: hasTime,
        default_style: defaultStyle,
        styles,
        ptype
    } = resource;

    const bbox = getExtentFromResource(resource);
    switch (ptype) {
    case GXP_PTYPES.REST_MAP:
    case GXP_PTYPES.REST_IMG: {
        const { url: arcgisUrl } = links.find(({ mime }) => mime === 'text/html') || {};
        return {
            perms,
            id: uuid(),
            pk,
            type: 'arcgis',
            name: alternate.replace('remoteWorkspace:', ''),
            url: arcgisUrl,
            ...(bbox && { bbox }),
            title,
            visibility: true
        };
    }
    default:
        const { url: wfsUrl } = links.find(({ link_type: linkType }) => linkType === 'OGC:WFS') || {};
        const { url: wmsUrl } = links.find(({ link_type: linkType }) => linkType === 'OGC:WMS') || {};
        const { url: wmtsUrl } = links.find(({ link_type: linkType }) => linkType === 'OGC:WMTS') || {};

        const dimensions = [
            ...(hasTime ? [{
                name: 'time',
                source: {
                    type: 'multidim-extension',
                    url: wmtsUrl || (wmsUrl || '').split('/geoserver/')[0] + '/geoserver/gwc/service/wmts'
                }
            }] : [])
        ];

        const params = wmsUrl && url.parse(wmsUrl, true).query;
        const format = getConfigProp('defaultLayerFormat') || 'image/png';
        return {
            perms,
            id: uuid(),
            pk,
            type: 'wms',
            name: alternate,
            url: wmsUrl || '',
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
            visibility: true,
            ...(defaultStyle && {
                defaultStyle: {
                    title: defaultStyle.sld_title,
                    name: defaultStyle.workspace ? `${defaultStyle.workspace}:${defaultStyle.name}` : defaultStyle.name
                }
            }),
            ...(styles && {
                availableStyles: [ ...styles ].map((style) => ({
                    title: style.sld_title,
                    name: style.workspace ? `${style.workspace}:${style.name}` : style.name
                }))
            }),
            ...(params && { params }),
            ...(dimensions.length > 0 && ({ dimensions }))
        };
    }
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
            permissions: resource.permissions,
            parsed: true,
            is_superuser: resource.is_superuser
        };
    }
    return {
        type: 'group',
        id: resource.id || resource?.group?.pk,
        name: resource.title,
        avatar: resource.logo,
        permissions: resource.permissions,
        parsed: true
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
            ...(groups || []).map((entry) => ({ ...entry, type: 'group', ...(!entry.parsed && { name: entry.name, avatar: entry.logo }) }))
        ],
        entries: [
            ...(users || []).map((entry) => ({ ...entry, type: 'user', ...(!entry.parsed && { name: entry.username, avatar: entry.avatar }) })),
            ...(organizations || []).map((entry) => ({ ...entry, type: 'group', ...(!entry.parsed && { name: entry.title, avatar: entry.logo }) }))
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

export const resourceHasPermission = (resource, perm) => {
    return resource?.perms?.includes(perm);
};


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
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'dataset_preview'
        })),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        name: 'Dataset',
        formatMetadataUrl: (resource) => (`/datasets/${resource.store}:${resource.alternate}/metadata`)
    },
    [ResourceTypes.MAP]: {
        icon: 'map',
        name: 'Map',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'map_preview'
        })),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/maps/${resource.pk}/metadata`)
    },
    [ResourceTypes.DOCUMENT]: {
        icon: 'file',
        name: 'Document',
        canPreviewed: (resource) => resourceHasPermission(resource, 'download_resourcebase'),
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/documents/${resource.pk}/metadata`)
    },
    [ResourceTypes.GEOSTORY]: {
        icon: 'book',
        name: 'GeoStory',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/apps/${resource.pk}/metadata`)
    },
    [ResourceTypes.DASHBOARD]: {
        icon: 'dashboard',
        name: 'Dashboard',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
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

export const getMetadataDetailUrl = (resource) => {
    return (getMetadataUrl(resource)) ? getMetadataUrl(resource) + '_detail' : '';
};

export const getResourceStatuses = (resource) => {
    const { processes } = resource || {};
    const isProcessing = processes
        ? !!processes.find(({ completed }) => !completed)
        : false;
    const deleteProcess = processes && processes.find(({ processType }) => processType === ProcessTypes.DELETE_RESOURCE);
    const isDeleting = isProcessing && !!deleteProcess?.output?.status && !deleteProcess?.completed;
    const isDeleted = deleteProcess?.output?.status === ProcessStatus.FINISHED;
    const copyProcess = processes && processes.find(({ processType }) => processType === ProcessTypes.COPY_RESOURCE);
    const isCopying = isProcessing && !!copyProcess?.output?.status && !copyProcess?.completed;
    const isCopied = deleteProcess?.output?.status === ProcessStatus.FINISHED;
    const isApproved = resource?.is_approved;
    const isPublished = isApproved && resource?.is_published;
    return {
        isApproved,
        isPublished,
        isProcessing,
        isDeleting,
        isDeleted,
        isCopying,
        isCopied
    };
};
