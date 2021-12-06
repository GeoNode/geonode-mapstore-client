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
import { bboxToPolygon } from '@js/utils/CoordinatesUtils';
import uniqBy from 'lodash/uniqBy';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';

/**
* @module utils/ResourceUtils
*/

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
        ptype
    } = resource;

    const bbox = getExtentFromResource(resource);
    const defaultStyleParams = defaultStyle && {
        defaultStyle: {
            title: defaultStyle.sld_title,
            name: defaultStyle.workspace ? `${defaultStyle.workspace}:${defaultStyle.name}` : defaultStyle.name
        }
    };

    const extendedParams = {
        pk,
        mapLayer: {
            dataset: resource
        },
        ...defaultStyleParams
    };

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
            visibility: true,
            extendedParams
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
            style: defaultStyleParams?.defaultStyle?.name || '',
            title,
            visibility: true,
            ...(params && { params }),
            ...(dimensions.length > 0 && ({ dimensions })),
            extendedParams
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
            parsed: true
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


export let availableResourceTypes; // resource types utils to be imported intoby @js/api/geonode/v2, Share plugin and anywhere else needed
/**
 * A setter funtion to assign a value to availableResourceTypes
 * @param {*} value Value to be assign to availableResourceTypes (gotten from resource_types response payload)
 */
export const setAvailableResourceTypes = (value) => {
    availableResourceTypes = value;
};

/**
 * Extracts lists of permissions into an object for use in the Share plugin select elements
 * @param {Object} options Permission Object to extract permissions from
 * @returns An object containing permissions for each type of user/group
 */
export const getResourcePermissions = (options) => {
    const permissionsOptions = {};
    Object.keys(options).forEach((key) => {
        const permissions = options[key];
        let selectOptions = [];
        for (let indx = 0; indx < permissions.length; indx++) {
            const permission = permissions[indx];
            if (permission !== 'owner') {
                selectOptions.push({
                    value: permission,
                    labelId: `gnviewer.${permission}Permission`
                });
            }
        }
        permissionsOptions[key] = selectOptions;
    });

    return permissionsOptions;
};

function parseStyleName({ workspace, name }) {
    const nameParts = name.split(':');
    if (nameParts.length > 1) {
        return name;
    }
    if (isString(workspace)) {
        return `${workspace}:${name}`;
    }
    if (isObject(workspace) && workspace?.name !== undefined) {
        return `${workspace.name}:${name}`;
    }
    return  name;
}

export function cleanStyles(styles = [], excluded = []) {
    return uniqBy(styles
        .map(({ name, sld_title: sldTitle, title, workspace, metadata, format }) => ({
            name: parseStyleName({ workspace, name }),
            title: sldTitle || title || name,
            metadata,
            format
        })), 'name')
        .filter(({ name }) => !excluded.includes(name));
}

export function getGeoNodeMapLayers(data) {
    return (data?.map?.layers || [])
        .filter(layer => layer?.extendedParams?.mapLayer)
        .map((layer) => {
            return {
                ...(layer?.extendedParams?.mapLayer && {
                    pk: layer.extendedParams.mapLayer.pk
                }),
                extra_params: {
                    msId: layer.id,
                    styles: cleanStyles(layer?.availableStyles)
                },
                current_style: layer.style || '',
                name: layer.name
            };
        });
}

export function toGeoNodeMapConfig(data, mapState) {
    if (!data) {
        return {};
    }
    const maplayers = getGeoNodeMapLayers(data);
    const { projection } = data?.map || {};
    const { bbox } = mapState || {};
    const llBboxPolygon = bboxToPolygon(bbox, 'EPSG:4326');
    const bboxPolygon = bboxToPolygon(bbox, projection);
    return {
        maplayers,
        ll_bbox_polygon: llBboxPolygon,
        srid: projection,
        // following properties are using the srid definition
        bbox_polygon: bboxPolygon
    };
}

export function compareBackgroundLayers(aLayer, bLayer) {
    return aLayer.type === bLayer.type
        && aLayer.name === bLayer.name
        && aLayer.source === bLayer.source
        && aLayer.provider === bLayer.provider
        && aLayer.url === bLayer.url;
}

export function toMapStoreMapConfig(resource, baseConfig) {
    const { maplayers = [], data } = resource || {};
    const baseMapBackgroundLayers = (baseConfig?.map?.layers || []).filter(layer => layer.group === 'background');
    const currentBackgroundLayer = (data?.map?.layers || [])
        .filter(layer => layer.group === 'background')
        .find(layer => layer.visibility && baseMapBackgroundLayers.find(bLayer => compareBackgroundLayers(layer, bLayer)));

    const backgroundLayers = !currentBackgroundLayer
        ? baseMapBackgroundLayers
        : baseMapBackgroundLayers.map((layer) => ({
            ...layer,
            visibility: compareBackgroundLayers(layer, currentBackgroundLayer)
        }));

    const layers = (data?.map?.layers || [])
        .filter(layer => layer.group !== 'background')
        .map((layer) => {
            const mapLayer = maplayers.find(mLayer => layer.id !== undefined && mLayer?.extra_params?.msId === layer.id);
            if (mapLayer) {
                const mapLayerDatasetStyles = cleanStyles([
                    ...(mapLayer?.dataset?.defaul_style ? [mapLayer.dataset.defaul_style] : []),
                    ...(mapLayer?.dataset?.styles || [])
                ]).map(({ name }) => name);
                return {
                    ...layer,
                    style: mapLayer.current_style || layer.style || '',
                    availableStyles: cleanStyles(mapLayer?.extra_params?.styles || [], mapLayerDatasetStyles),
                    featureInfo: {
                        ...layer?.featureInfo,
                        template: mapLayer?.dataset?.featureinfo_custom_template || ''
                    },
                    extendedParams: {
                        ...layer.extendedParams,
                        mapLayer
                    }
                };
            }
            if (!mapLayer && layer?.extendedParams?.mapLayer) {
                return null;
            }
            return layer;
        })
        .filter(layer => layer);

    // add all the map layers not included in the blob
    const addMapLayers = maplayers
        .filter(mLayer => mLayer?.dataset)
        .filter(mLayer => !layers.find(layer => layer.id !== undefined && mLayer?.extra_params?.msId === layer.id))
        .map(mLayer => resourceToLayerConfig(mLayer?.dataset));

    return {
        ...data,
        map: {
            ...data?.map,
            layers: [
                ...backgroundLayers,
                ...layers,
                ...addMapLayers
            ]
        }
    };
}
