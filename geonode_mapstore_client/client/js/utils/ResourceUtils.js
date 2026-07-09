/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import { isEmpty, uniqBy, omit, orderBy, isString, isObject } from 'lodash';

import { getConfigProp, convertFromLegacy, normalizeConfig } from '@mapstore/framework/utils/ConfigUtils';
import { excludeGoogleBackground, extractTileMatrixFromSources } from '@mapstore/framework/utils/LayersUtils';
import { SOURCE_TYPES, FEATURE_INFO_FORMAT, GXP_PTYPES, ResourceTypes, isDefaultDatasetSubtype, getDimensions, resourceToLayers, resourceToLayerConfig } from '@mapstore/framework/utils/GeoNodeUtils';

import { getGeoNodeLocalConfig, parseDevHostname } from '@js/utils/APIUtils';
import { ProcessTypes, ProcessStatus } from '@js/utils/ResourceServiceUtils';
import { determineResourceType } from '@js/utils/FileUtils';

export { SOURCE_TYPES, FEATURE_INFO_FORMAT, GXP_PTYPES, ResourceTypes, isDefaultDatasetSubtype, getDimensions, resourceToLayers, resourceToLayerConfig };

/**
* @module utils/ResourceUtils
*/

const RESOURCE_PUBLISHING_PROPERTIES_BASE = {
    'is_published': {
        labelId: 'gnviewer.publishResource',
        tooltipId: 'gnviewer.publishResourceTooltip',
        disabled: (perms = []) => !perms.includes('publish_resourcebase')
    },
    'featured': {
        labelId: 'gnviewer.featureResource',
        tooltipId: 'gnviewer.featureResourceTooltip',
        disabled: (perms = []) => !perms.includes('feature_resourcebase')
    },
    'advertised': {
        labelId: 'gnviewer.advertiseResource',
        tooltipId: 'gnviewer.advertiseResourceTooltip',
        disabled: (perms = []) => !perms.includes('change_resourcebase')
    }
};

const RESOURCE_OPTIONS_PROPERTIES_BASE = {
    'metadata_uploaded_preserve': {
        labelId: 'gnviewer.preserveUploadedMetadata',
        tooltipId: 'gnviewer.preserveUploadedMetadataTooltip',
        disabled: (perms = []) => !perms.includes('change_resourcebase')
    },
    'is_approved': {
        labelId: 'gnviewer.approveResource',
        tooltipId: 'gnviewer.approveResourceTooltip',
        disabled: (perms = []) => !perms.includes('approve_resourcebase')
    }
};

export const filterResourcePublishingProperties = () => {
    const { isPublishedOptionEnabled = false } = getConfigProp('geoNodeSettings') || {};

    // Remove is_published if RESOURCE_PUBLISHING is disabled
    if (!isPublishedOptionEnabled) {
        return omit(RESOURCE_PUBLISHING_PROPERTIES_BASE, 'is_published');
    }

    return RESOURCE_PUBLISHING_PROPERTIES_BASE;
};

export const filterResourceOptionsProperties = () => {
    const { isApprovedOptionEnabled = false } = getConfigProp('geoNodeSettings') || {};

    // Remove is_approved if ADMIN_MODERATE_UPLOADS is disabled
    if (!isApprovedOptionEnabled) {
        return omit(RESOURCE_OPTIONS_PROPERTIES_BASE, 'is_approved');
    }

    return RESOURCE_OPTIONS_PROPERTIES_BASE;
};

export const RESOURCE_PUBLISHING_PROPERTIES = filterResourcePublishingProperties();
export const RESOURCE_OPTIONS_PROPERTIES = filterResourceOptionsProperties();
export const TIME_SERIES_PROPERTIES = ['attribute', 'end_attribute', 'presentation', 'precision_value', 'precision_step'];

export const TIME_ATTRIBUTE_TYPES = ['xsd:date', 'xsd:dateTime', 'xsd:date-time', 'xsd:time'];

export const TIME_PRECISION_STEPS = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

// Formats that support styling in GeoServer.
export const STYLE_SUPPORTED_LAYER_TYPES = ['vector', 'raster', 'vector_time'];

function updateUrlQueryParameter(requestUrl = '', query) {
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

function getPermissionsListEntry(entry, type, user) {
    const isCurrentUserEntry = type === 'user' && !!user?.pk && entry?.id === user.pk;
    const disabled = !!isCurrentUserEntry;

    if (type === 'user') {
        return {
            ...entry,
            type,
            disabled,
            ...(!entry.parsed && { name: entry.username, avatar: entry.avatar })
        };
    }

    return {
        ...entry,
        type,
        disabled,
        ...(!entry.parsed && { name: entry.title, avatar: entry.logo })
    };
}

export function permissionsCompactToLists({ groups, users, organizations }, user) {
    return {
        groups: [
            ...(groups || []).map((entry) => ({ ...entry, type: 'group', ...(!entry.parsed && { name: entry.name, avatar: entry.logo }) }))
        ],
        entries: [
            ...(users || []).map((entry) => getPermissionsListEntry(entry, 'user', user)),
            ...(organizations || []).map((entry) => getPermissionsListEntry(entry, 'group', user))
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
    return !!resource?.perms?.includes(perm);
};


export const isDocumentExternalSource = (resource) => {
    return resource && resource.resource_type === ResourceTypes.DOCUMENT && resource.sourcetype === SOURCE_TYPES.REMOTE;
};

export const getResourceTypesInfo = () => ({
    'null': {
        icon: { glyph: 'dataset' },
        name: '',
        canPreviewed: () => false,
        formatEmbedUrl: () => undefined,
        formatDetailUrl: () => undefined,
        formatMetadataUrl: () => undefined,
        formatMetadataDetailUrl: () => undefined
    },
    [ResourceTypes.DATASET]: {
        icon: { glyph: 'dataset' },
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => resource.embed_url && parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'dataset_preview'
        })),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        name: 'Dataset',
        formatMetadataUrl: (resource) => `#/metadata/${resource.pk}`,
        formatMetadataDetailUrl: (resource) => `/metadata/${resource.pk}`
    },
    [ResourceTypes.MAP]: {
        icon: { glyph: '1-map' },
        name: 'Map',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'map_preview'
        })),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => `#/metadata/${resource.pk}`,
        formatMetadataDetailUrl: (resource) => `/metadata/${resource.pk}`
    },
    [ResourceTypes.DOCUMENT]: {
        icon: { glyph: 'document' },
        name: 'Document',
        canPreviewed: (resource) => resourceHasPermission(resource, 'download_resourcebase') && !!(determineResourceType(resource.extension) !== 'unsupported'),
        hasPermission: (resource) => resourceHasPermission(resource, 'download_resourcebase'),
        formatEmbedUrl: (resource) => isDocumentExternalSource(resource) ? undefined : resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => `#/metadata/${resource.pk}`,
        formatMetadataDetailUrl: (resource) => `/metadata/${resource.pk}`,
        metadataPreviewUrl: (resource) => `/metadata/${resource.pk}/embed`
    },
    [ResourceTypes.GEOSTORY]: {
        icon: { glyph: 'geostory' },
        name: 'GeoStory',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => `#/metadata/${resource.pk}`,
        formatMetadataDetailUrl: (resource) => `/metadata/${resource.pk}`
    },
    [ResourceTypes.DASHBOARD]: {
        icon: { glyph: 'dashboard' },
        name: 'Dashboard',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => `#/metadata/${resource.pk}`,
        formatMetadataDetailUrl: (resource) => `/metadata/${resource.pk}`
    },
    [ResourceTypes.VIEWER]: {
        icon: { glyph: 'context' },
        name: 'MapViewer',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: () => false,
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => `#/metadata/${resource.pk}`,
        formatMetadataDetailUrl: (resource) => `/metadata/${resource.pk}`
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
    if (resource) {
        const { formatMetadataDetailUrl = () => '' } = getResourceTypesInfo()[resource?.resource_type] || {};
        return formatMetadataDetailUrl(resource);
    }
    return '';
};

export const getResourceStatuses = (resource, userInfo) => {
    const { executions = [] } = resource || {};
    const isApproved = resource?.is_approved;
    const isPublished = isApproved && resource?.is_published;
    const runningExecutions = executions.filter(({ func_name: funcName, status, user }) =>
        [ProcessStatus.RUNNING, ProcessStatus.READY].includes(status)
        && ['delete', 'copy', 'copy_geonode_resource', ProcessTypes.DELETE_RESOURCE, ProcessTypes.COPY_RESOURCE].includes(funcName)
        && (user === undefined || user === userInfo?.info?.preferred_username));
    const isProcessing = !!runningExecutions.length;
    const isDeleting = runningExecutions.some(({ func_name: funcName }) => ['delete', ProcessTypes.DELETE_RESOURCE].includes(funcName));
    const isCopying = runningExecutions.some(({ func_name: funcName }) => ['copy', 'copy_geonode_resource', ProcessTypes.COPY_RESOURCE].includes(funcName));
    return {
        isApproved,
        isPublished,
        isProcessing,
        isDeleting,
        isCopying,
        items: [
            ...(resource.advertised === false ? [{
                type: 'icon',
                tooltipId: 'resourcesCatalog.unadvertised',
                glyph: 'eye-slash'
            }] : []),
            ...(isDeleting ? [{
                type: 'text',
                labelId: 'gnviewer.deleting',
                variant: 'danger'
            }] : []),
            ...(isCopying ? [{
                type: 'text',
                labelId: 'gnviewer.cloning',
                variant: 'primary'
            }] : [])
        ]
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

export const canManageAnonymousPermissions = (resource) => {
    return resourceHasPermission(resource, 'can_manage_anonymous_permissions');
};

export const canManageRegisteredMemberPermissions = (resource) => {
    return resourceHasPermission(resource, 'can_manage_registered_member_permissions');
};

/**
 * Filters permission options for a group if management is disabled.
 * If management is disabled, it restricts the options to only the current permission.
 * @param {object} options The permissions options object.
 * @param {array} groups The list of groups with their current permissions.
 * @param {array} groupNames Array of group names to filter ('anonymous' or 'registered-members').
 * @returns {object} Filtered permissions options
 */
const filterGroupPermissions = (options, groups, groupNames) => {
    return groupNames.length
        ? Object.fromEntries(Object.keys(options)
            .map((key) => {
                if (groupNames.some(name => name === key)) {
                    const group = groups?.find(g => g.name === key);
                    const permissionValue = group?.permissions;
                    const currentPermission = options[key].find(p => p.name === permissionValue);
                    return currentPermission ? [key, [currentPermission]] : [key, options[key]];
                }
                return [key, options[key]];
            }))
        : options;
};

/**
 * Extracts lists of permissions into an object for use in the Share plugin select elements
 * @param {Object} options Permission Object to extract permissions from
 * @returns An object containing permissions for each type of user/group
 */
export const getResourcePermissions = (_options, groups, manageAnonymousPermissions = false, manageRegisteredMemberPermissions = false) => {
    const options = filterGroupPermissions(_options, groups, [
        ...(manageAnonymousPermissions ? [] : ['anonymous']),
        ...(manageRegisteredMemberPermissions ? [] : ['registered-members'])
    ]);
    let permissionsOptions = {};
    Object.keys(options).forEach((key) => {
        const permissions = options[key];
        let selectOptions = [];
        for (let indx = 0; indx < permissions.length; indx++) {
            const permission = permissions[indx].name || permissions[indx];
            const label = permissions[indx].label;
            if (permission !== 'owner') {
                selectOptions.push({
                    value: permission,
                    labelId: `gnviewer.${permission}Permission`,
                    label
                });
            }
        }
        permissionsOptions[key] = selectOptions;
    });

    return permissionsOptions;
};

export function parseStyleName({ workspace, name }) {
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
    return name;
}

export function cleanStyles(styles = [], excluded = []) {
    return uniqBy(styles
        .map(({ name, sld_title: sldTitle, title, workspace, metadata, format, canEdit }) => ({
            name: parseStyleName({ workspace, name }),
            title: sldTitle || title || name,
            metadata,
            format,
            canEdit
        })), 'name')
        .filter(({ name }) => !excluded.includes(name));
}

export function getGeoNodeMapLayers(data) {
    return (data?.map?.layers || [])
        .filter(layer => layer?.extendedParams?.pk && layer?.group !== "background")
        .map((layer, index) => {
            return {
                ...(layer.extendedParams.mapLayer?.pk && {
                    pk: layer.extendedParams.mapLayer.pk
                }),
                extra_params: {
                    msId: layer.id
                },
                ...(layer.type === 'wms' && {
                    current_style: layer.style || ''
                }),
                name: layer?.extendedParams?.alternate || layer.name || '',
                order: index,
                opacity: layer.opacity ?? 1,
                visibility: layer.visibility
            };
        });
}

export function toGeoNodeMapConfig(data) {
    if (!data) {
        return {};
    }
    const maplayers = getGeoNodeMapLayers(data);
    return {
        maplayers,
        data: {
            ...data,
            map: {
                ...data?.map,
                layers: (data?.map?.layers || []).map((layer) => {
                    return {
                        ...layer,
                        // clean up extended params
                        ...(layer?.extendedParams?.pk && {
                            extendedParams: {
                                pk: layer.extendedParams.pk,
                                alternate: layer.extendedParams.alternate,
                                ...(layer.extendedParams.mapLayer?.pk && {
                                    mapLayer: { pk: layer.extendedParams.mapLayer.pk }
                                })
                            }
                        })
                    };
                })
            }
        }
    };
}

export function toMapStoreMapConfig(resource, baseConfig) {
    const { maplayers = [], data } = resource || {};
    const backgroundLayers = (data?.map?.layers || []).filter(layer => layer.group === 'background');
    const layers = (data?.map?.layers || [])
        .filter(layer => layer.group !== 'background')
        .map((layer) => {
            const mapLayer = maplayers.find(mLayer => layer.id !== undefined && mLayer?.extra_params?.msId === layer.id);
            if (mapLayer) {
                return {
                    ...layer,
                    ...(layer.type === 'wms' && {
                        style: mapLayer.current_style || layer.style || ''
                    }),
                    extendedParams: {
                        pk: mapLayer.dataset?.pk ?? layer.extendedParams?.pk,
                        alternate: mapLayer.dataset?.alternate ?? layer.extendedParams?.alternate ?? layer.name,
                        ...(mapLayer.pk !== undefined && {
                            mapLayer: { pk: mapLayer.pk }
                        })
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

    const { catalogueServices = {}, catalogueSelectedService = '' } = getConfigProp('geoNodeSettings') || {};
    const existingServices = data?.catalogServices?.services || {};
    const missingServices = Object.fromEntries(
        Object.entries(catalogueServices).filter(([key]) => !existingServices[key])
    );
    const catalogServices = Object.keys(missingServices).length > 0
        ? {
            services: { ...missingServices, ...existingServices },
            selectedService: data?.catalogServices?.selectedService || catalogueSelectedService
        }
        : data?.catalogServices;

    return {
        ...data,
        ...(catalogServices && { catalogServices }),
        map: {
            ...data?.map,
            layers: [
                ...backgroundLayers,
                ...layers,
                ...addMapLayers
            ],
            sources: {
                ...data?.map?.sources,
                ...baseConfig?.map?.sources
            }
        }
    };
}

/**
 * Parse document response object (for image and video)
 * @param {Object} docResponse api response object
 * @param {Object} resource optional resource object
 * @returns {Object} new document config object
 */
export const parseDocumentConfig = (docResponse, resource = {}) => {

    return {
        thumbnail: docResponse.thumbnail_url,
        src: docResponse.href,
        title: docResponse.title,
        description: docResponse.raw_abstract,
        credits: docResponse.attribution,
        sourceId: docResponse.sourceId || 'geonode',
        ...((docResponse.subtype || docResponse.type) === 'image' &&
            { alt: docResponse.alternate, src: docResponse.href, ...(resource?.imgHeight && { imgHeight: resource?.imgHeight, imgWidth: resource?.imgWidth }) })
    };
};

/**
 * Parse map response object
 * @param {Object} mapResponse api response object
 * @param {Object} resource optional resource object
 * @returns {Object} new map config object
 */
export const parseMapConfig = (mapResponse, resource = {}) => {

    const { data, pk: id } = mapResponse;
    const config = data;
    const mapState = !config.version
        ? convertFromLegacy(config)
        : normalizeConfig(config.map);

    const layers = excludeGoogleBackground(mapState.layers.map(layer => {
        if (layer.group === 'background' && (layer.type === 'ol' || layer.type === 'OpenLayers.Layer')) {
            layer.type = 'empty';
        }
        return layer;
    }));

    const map = {
        ...(mapState && mapState.map || {}),
        id,
        sourceId: resource?.data?.sourceId || 'geonode',
        groups: mapState && mapState.groups || [],
        layers: mapState?.map?.sources
            ? layers.map(layer => {
                const tileMatrix = extractTileMatrixFromSources(mapState.map.sources, layer);
                return { ...layer, ...tileMatrix };
            })
            : layers
    };

    return {
        ...map,
        id,
        owner: mapResponse?.owner?.username,
        canCopy: true,
        canDelete: true,
        canEdit: true,
        name: resource?.data?.title || mapResponse?.title,
        description: resource?.data?.description || mapResponse?.abstract,
        thumbnail: resource?.data?.thumbnail || mapResponse?.thumbnail_url,
        type: 'map'
    };
};

/*
* Util to check if resource can be cloned (Save As)
* Requirements for copying are 'add_resource' permission and is_copyable property on resource
* the dataset and document need also the download_resourcebase permission
*/
export const canCopyResource = (resource, user) => {
    const canAdd = user?.perms?.includes('add_resource');
    const canCopy = resource?.is_copyable;
    const resourceType = resource?.resource_type;
    if ([ResourceTypes.DATASET, ResourceTypes.DOCUMENT].includes(resourceType)) {
        const canDownload = !!resource?.perms?.includes('download_resourcebase');
        return (canAdd && canCopy && canDownload) ? true : false;
    }
    return (canAdd && canCopy) ? true : false;
};

export const parseUploadResponse = (upload) => {
    return orderBy(uniqBy([...upload], 'id'), 'create_date', 'desc');
};

export const processUploadResponse = (response) => {
    const newResponse = response.reduce((acc, currentResponse) => {
        const duplicate = acc.find((upload) => {
            if (upload.id && currentResponse.id) {
                return upload.id === currentResponse.id;
            } else if (upload.id && currentResponse.exec_id) {
                return upload.id === currentResponse.exec_id;
            } else if (upload.exec_id && currentResponse.id) {
                return upload.exec_id === currentResponse.id;
            }
            return upload.exec_id === currentResponse.exec_id;
        });
        if (duplicate) {
            const newAcc = acc.filter((upload) => {
                if (upload.id && currentResponse.id) {
                    return upload.id !== currentResponse.id;
                } else if (upload.id && currentResponse.exec_id) {
                    return upload.id !== currentResponse.exec_id;
                } else if (upload.exec_id && currentResponse.id) {
                    return upload.exec_id !== currentResponse.id;
                }
                return upload.exec_id !== currentResponse.exec_id;
            });
            return [{...currentResponse, ...(!currentResponse.id && {create_date: currentResponse.created, id: currentResponse.exec_id})}, ...newAcc];
        }
        return [{...currentResponse, ...(!currentResponse.id && {create_date: currentResponse.created, id: currentResponse.exec_id})}, ...acc];
    }, []);

    const uploads = parseUploadResponse(newResponse);

    return uploads;
};

export const cleanUrl = (targetUrl) => {
    const {
        search,
        ...params
    } = url.parse(targetUrl);
    const hash = params.hash && `#${cleanUrl(params.hash.replace('#', ''))}`;
    return url.format({
        ...params,
        ...(hash && { hash })
    });
};

export const getResourceImageSource = (image) => {
    return image ? image : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADICAIAAABZHvsFAAAACXBIWXMAAC4jAAAuIwF4pT92AAABiklEQVR42u3SAQ0AAAjDMMC/5+MAAaSVsKyTFHwxEmBoMDQYGgyNocHQYGgwNBgaQ4OhwdBgaDA0hgZDg6HB0GBoDA2GBkODocHQGBoMDYYGQ4OhMTQYGgwNhgZDY2gwNBgaDI2hwdBgaDA0GBpDg6HB0GBoMDSGBkODocHQYGgMDYYGQ4OhwdAYGgwNhgZDg6ExNBgaDA2GBkNjaDA0GBoMDYbG0GBoMDQYGkODocHQYGgwNIYGQ4OhwdBgaAwNhgZDg6HB0BgaDA2GBkODoTE0GBoMDYYGQ2NoMDQYGgwNhsbQYGgwNBgaQ4OhwdBgaDA0hgZDg6HB0GBoDA2GBkODocHQGBoMDYYGQ4OhMTQYGgwNhgZDY2gwNBgaDA2GxtBgaDA0GBoMjaHB0GBoMDSGBkODocHQYGgMDYYGQ4OhwdAYGgwNhgZDg6ExNBgaDA2GBkNjaDA0GBoMDYbG0GBoMDQYGgyNocHQYGgwNIYGQ4OhwdBgaAwNhgZDg6HB0BgaDA2GBkPDbQH4OQSN0W8qegAAAABJRU5ErkJggg==';
};

export const hasDefaultDownload = (resource) => {
    return !isEmpty(resource?.download_urls) && resource.download_urls.some((d) => d.default);
};

export const getDownloadUrlInfo = (resource) => {
    const hrefUrl = { url: resource?.href, ajaxSafe: false };
    if (isDocumentExternalSource(resource)) {
        return hrefUrl;
    }
    const downloadUrls = resource?.download_urls ?? [];
    if (!isEmpty(downloadUrls)) {

        // For datasets, use only default download url
        if (resource?.resource_type === ResourceTypes.DATASET) {
            const downloadData = downloadUrls.find((d) => d.default);
            const _url = !isEmpty(downloadData) ? downloadData.url : null;
            const ajaxSafe = !isEmpty(downloadData) ? downloadData.ajax_safe : false;
            return { url: _url, ajaxSafe };
        }

        const downloadData = resource.download_urls.length === 1
            ? resource.download_urls[0]
            : resource.download_urls.find((d) => d.default);
        if (!isEmpty(downloadData)) {
            return { url: downloadData.url, ajaxSafe: downloadData.ajax_safe };
        }
    }
    return hrefUrl;
};

export const formatResourceLinkUrl = (resource) => {
    let href = window.location.origin;
    if (resource?.uuid) {
        href = href + `/catalogue/uuid/${resource.uuid}`;
    }
    return href;
};

export const getCataloguePath = (path = '') => {
    const catalogPagePath = getGeoNodeLocalConfig('geoNodeSettings.catalogPagePath');
    if (!isEmpty(catalogPagePath)) {
        return path.replace('/catalogue/', catalogPagePath);
    }
    return path;
};

export const getResourceWithLinkedResources = (resource = {}) => {
    let linkedResources = resource.linked_resources ?? {};
    if (!isEmpty(linkedResources)) {
        const linkedTo = linkedResources.linked_to ?? [];
        const linkedBy = linkedResources.linked_by ?? [];
        linkedResources = isEmpty(linkedTo) && isEmpty(linkedBy) ? {} : ({ linkedTo, linkedBy });
        return { ...omit(resource, 'linked_resources'), linkedResources };
    }
    return resource;
};

export const getResourceAdditionalProperties = (_resource = {}) => {
    const resource =  getResourceWithLinkedResources(_resource);
    const links = resource?.links || [];
    const assets = links.filter(link => link?.extras?.type === 'asset' && link?.extras?.content?.title);
    return {
        ...resource,
        assets: assets.length ? assets : [{_showEmptyState: true}] // add empty state flag to show assets section
    };
};

// Normalizes a dataset resource's `data` payload to the shape
// `{ layerSettings, mapConfig: { map?, crsSelector? } }`. Legacy records stored
// the layer settings as the top-level `data` object and projection state under
// `data.crsSelector`; new records nest both halves explicitly. Idempotent on
// already-normalized payloads so the caller can run it without checking.
export const parseMapLayerData = (data) => {
    if (!data || typeof data !== 'object') {
        return { layerSettings: {}, mapConfig: {} };
    }
    if ('layerSettings' in data || 'mapConfig' in data) {
        return {
            layerSettings: data.layerSettings ?? {},
            mapConfig: data.mapConfig ?? {}
        };
    }
    const legacyCrsSelector = data.crsSelector;
    return {
        layerSettings: omit(data, ['crsSelector']),
        mapConfig: {
            ...(legacyCrsSelector?.currentProjection && {
                map: { projection: legacyCrsSelector.currentProjection }
            }),
            ...(legacyCrsSelector?.projectionList && {
                crsSelector: { projectionList: legacyCrsSelector.projectionList }
            })
        }
    };
};

export const parseCatalogResource = (resource, user) => {
    const {
        formatDetailUrl,
        icon,
        formatEmbedUrl,
        canPreviewed,
        hasPermission,
        name
    } = getResourceTypesInfo(resource)[resource.resource_type] || {};
    const resourceCanPreviewed = resource?.pk && canPreviewed && canPreviewed(resource);
    const embedUrl = resourceCanPreviewed && formatEmbedUrl && resource?.embed_url && formatEmbedUrl(resource);
    const canView = resource?.pk && hasPermission && hasPermission(resource);
    const viewerUrl = formatDetailUrl(resource);
    const viewerUrlParts = (viewerUrl || '').split('#');
    const viewerPath = viewerUrlParts[viewerUrlParts.length - 1];
    const metadataDetailUrl = resource?.pk && getMetadataDetailUrl(resource);
    return {
        ...resource,
        id: resource.pk,
        name: resource.title,
        '@extras': {
            info: {
                title: resource?.title,
                icon,
                thumbnailUrl: resource?.thumbnail_url,
                ...((canView || resourceCanPreviewed) && {
                    viewerPath: viewerPath,
                    viewerUrl: viewerUrl
                }),
                embedUrl,
                metadataDetailUrl,
                typeName: name
            },
            status: getResourceStatuses(resource, user)
        }
    };
};

export const canManageResourcePublishing = (resource) => {
    const { perms } = resource || {};
    const settingsPerms = ['feature_resourcebase', 'change_resourcebase', 'publish_resourcebase'];
    return !!(perms || []).find(perm => settingsPerms.includes(perm));
};

export const canManageResourceOptions = (resource) => {
    const { perms } = resource || {};
    const settingsPerms = ['change_resourcebase', 'approve_resourcebase'];
    return !!(perms || []).find(perm => settingsPerms.includes(perm));
};

export const canManageResourceSettings = (resource) => {
    return !!(canManageResourcePublishing(resource) || canManageResourceOptions(resource));
};

export const canAccessPermissions = (resource) => {
    const { perms } = resource || {};
    return perms?.includes('change_resourcebase_permissions');
};

/**
 * Check if the resource can be edited (for map resources)
 * @param {Object} gnresource - The state of the resource
 * @param {Object} options - The options for the check
 * @param {boolean} options.isNewCheck - True if the check should be done for a new resource, false otherwise
 * @returns {boolean} - True if the resource can be edited, false otherwise
 */
export const canEditMap = (gnresource, { resourceTypes = [ResourceTypes.MAP], isNewCheck = false } = {}) => {
    const { data = {}, type, isNew } = gnresource;
    const hasEditPermission = data?.perms?.includes('change_resourcebase');
    return type && resourceTypes.includes(type) && (hasEditPermission || (isNewCheck && isNew)) ? true : false;
};
