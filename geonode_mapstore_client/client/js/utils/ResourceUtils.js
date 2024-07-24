/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import uuid from 'uuid';
import url from 'url';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { getConfigProp, convertFromLegacy, normalizeConfig } from '@mapstore/framework/utils/ConfigUtils';
import { getGeoNodeLocalConfig, parseDevHostname } from '@js/utils/APIUtils';
import { ProcessTypes, ProcessStatus } from '@js/utils/ResourceServiceUtils';
import { uniqBy, orderBy, isString, isObject, pick, difference } from 'lodash';
import { excludeGoogleBackground, extractTileMatrixFromSources } from '@mapstore/framework/utils/LayersUtils';
import { determineResourceType } from '@js/utils/FileUtils';

/**
* @module utils/ResourceUtils
*/

function getExtentFromResource({ extent }) {
    if (isEmpty(extent?.coords)) {
        return null;
    }
    const [minx, miny, maxx, maxy] = extent.coords;

    // if the extent is greater than the max extent of the WGS84 return null
    const WGS84_MAX_EXTENT = [-180, -90, 180, 90];
    if (minx < WGS84_MAX_EXTENT[0] || miny < WGS84_MAX_EXTENT[1] || maxx > WGS84_MAX_EXTENT[2] || maxy > WGS84_MAX_EXTENT[3]) {
        return null;
    }
    const bbox = {
        crs: 'EPSG:4326',
        bounds: { minx, miny, maxx, maxy }
    };
    return bbox;
}

export const GXP_PTYPES = {
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

export const FEATURE_INFO_FORMAT = 'TEMPLATE';

const datasetAttributeSetToFields = ({ attribute_set: attributeSet = [] }) => {
    return attributeSet
        .filter(({ attribute_type: type }) => !type.includes('gml:'))
        .map(({
            attribute,
            attribute_label: alias,
            attribute_type: type
        }) => {
            return {
                name: attribute,
                alias: alias,
                type: type
            };
        });
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
        const { url: arcgisUrl } = links.find(({ mime, link_type: linkType }) => (mime === 'text/html' && linkType === 'image')) || {};
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
        const {
            defaultLayerFormat = 'image/png',
            defaultTileSize = 512
        } = getConfigProp('geoNodeSettings') || {};
        const fields = datasetAttributeSetToFields(resource);
        return {
            perms,
            id: uuid(),
            pk,
            type: 'wms',
            name: alternate,
            url: wmsUrl || '',
            format: defaultLayerFormat,
            ...(wfsUrl && {
                search: {
                    type: 'wfs',
                    url: wfsUrl
                }
            }),
            ...(bbox ? { bbox } : { bboxError: true }),
            ...(template && {
                featureInfo: {
                    format: FEATURE_INFO_FORMAT,
                    template
                }
            }),
            style: defaultStyleParams?.defaultStyle?.name || '',
            title,
            tileSize: defaultTileSize,
            visibility: true,
            ...(params && { params }),
            ...(dimensions.length > 0 && ({ dimensions })),
            extendedParams,
            ...(fields && { fields })
        };
    }
};

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
    DASHBOARD: 'dashboard',
    VIEWER: 'mapviewer'
};

export const isDocumentExternalSource = (resource) => {
    return resource && resource.resource_type === ResourceTypes.DOCUMENT && resource.sourcetype === 'REMOTE';
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
        formatMetadataUrl: (resource) => (`/datasets/${resource.store ? resource.store + ":" : ''}${resource.alternate}/metadata`),
        catalogPageUrl: '/datasets'
    },
    [ResourceTypes.MAP]: {
        icon: 'map',
        name: 'Map',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'map_preview'
        })),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/maps/${resource.pk}/metadata`),
        catalogPageUrl: '/maps'
    },
    [ResourceTypes.DOCUMENT]: {
        icon: 'file',
        name: 'Document',
        canPreviewed: (resource) => resourceHasPermission(resource, 'download_resourcebase') && !!(determineResourceType(resource.extension) !== 'unsupported'),
        hasPermission: (resource) => resourceHasPermission(resource, 'download_resourcebase'),
        formatEmbedUrl: (resource) => isDocumentExternalSource(resource) ? undefined : resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/documents/${resource.pk}/metadata`),
        metadataPreviewUrl: (resource) => (`/documents/${resource.pk}/metadata_detail?preview`),
        catalogPageUrl: '/documents'
    },
    [ResourceTypes.GEOSTORY]: {
        icon: 'book',
        name: 'GeoStory',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/apps/${resource.pk}/metadata`),
        catalogPageUrl: '/geostories'
    },
    [ResourceTypes.DASHBOARD]: {
        icon: 'dashboard',
        name: 'Dashboard',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/apps/${resource.pk}/metadata`),
        catalogPageUrl: '/dashboards'
    },
    [ResourceTypes.VIEWER]: {
        icon: 'cogs',
        name: 'MapViewer',
        canPreviewed: (resource) => resourceHasPermission(resource, 'view_resourcebase'),
        formatEmbedUrl: () => false,
        formatDetailUrl: (resource) => resource?.detail_url && parseDevHostname(resource.detail_url),
        formatMetadataUrl: (resource) => (`/apps/${resource.pk}/metadata`),
        catalogPageUrl: '/all'
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
        .filter(layer => layer?.extendedParams?.mapLayer)
        .map((layer, index) => {
            return {
                ...(layer?.extendedParams?.mapLayer && {
                    pk: layer.extendedParams.mapLayer.pk
                }),
                extra_params: {
                    msId: layer.id,
                    styles: cleanStyles(layer?.availableStyles)
                        .map(({ canEdit, metadata, ...style }) => ({ ...style }))
                },
                current_style: layer.style || '',
                name: layer.name,
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
        maplayers
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
                const template = mapLayer?.dataset?.featureinfo_custom_template || '';
                return {
                    ...layer,
                    style: mapLayer.current_style || layer.style || '',
                    availableStyles: cleanStyles(mapLayer?.extra_params?.styles || [], mapLayerDatasetStyles),
                    featureInfo: {
                        ...layer?.featureInfo,
                        format: layer?.featureInfo?.format ?? (template ? FEATURE_INFO_FORMAT : undefined),
                        template
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

export const excludeDeletedResources = (suppliedResources) => {
    return suppliedResources.filter((resource) => {
        const { isDeleted } = getResourceStatuses(resource);
        return !isDeleted && resource;
    });
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

export const parseUploadFiles = (data) => {
    const { uploadFiles = {}, supportedDatasetTypes = [], supportedOptionalExtensions = [], supportedRequiresExtensions = [] } = data;
    const mainFileTypes = supportedDatasetTypes.filter(file => !file.needsFiles);
    const mainFileTypeKeys = mainFileTypes.map(({ id }) => id);

    return Object.keys(uploadFiles)
        .reduce((acc, baseName) => {
            const uploadFile = uploadFiles[baseName] || {};
            const { requires = [], ext = [], optional = [], needsFiles = [] } = supportedDatasetTypes.find(({ id }) => id === uploadFile.type) || {};
            const cleanedFiles = pick(uploadFile.files, [...requires, ...ext, ...optional, ...needsFiles]);
            const filesKeys = Object.keys(cleanedFiles);
            const files = requires.length > 0
                ? cleanedFiles
                : filesKeys.length > 1
                    ? pick(cleanedFiles, supportedOptionalExtensions.includes(ext[0]) ? [...needsFiles, ext[0]] : ext[0])
                    : cleanedFiles;
            const newFileKeys = Object.keys(files);
            const requiredFilesIncluded = newFileKeys.filter((id) => supportedRequiresExtensions.includes(id)) || [];
            const missingExt = requires.length > 0
                ? requires.filter((fileExt) => !filesKeys.includes(fileExt))
                : requiredFilesIncluded.length > 0 ? difference(supportedRequiresExtensions, requiredFilesIncluded) : [];

            const mainExt = filesKeys.find(key => ext.includes(key));
            const addMissingFiles = supportedOptionalExtensions.includes(mainExt) && missingExt?.length === 0 && !(mainFileTypeKeys.some((type) => newFileKeys.includes(type)));

            return {
                ...acc,
                [baseName]: {
                    ...uploadFile,
                    mainExt,
                    files,
                    missingExt,
                    addMissingFiles
                }
            };
        }, {});
};


export const getResourceImageSource = (image) => {
    return image ? image : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADICAIAAABZHvsFAAAACXBIWXMAAC4jAAAuIwF4pT92AAABiklEQVR42u3SAQ0AAAjDMMC/5+MAAaSVsKyTFHwxEmBoMDQYGgyNocHQYGgwNBgaQ4OhwdBgaDA0hgZDg6HB0GBoDA2GBkODocHQGBoMDYYGQ4OhMTQYGgwNhgZDY2gwNBgaDI2hwdBgaDA0GBpDg6HB0GBoMDSGBkODocHQYGgMDYYGQ4OhwdAYGgwNhgZDg6ExNBgaDA2GBkNjaDA0GBoMDYbG0GBoMDQYGkODocHQYGgwNIYGQ4OhwdBgaAwNhgZDg6HB0BgaDA2GBkODoTE0GBoMDYYGQ2NoMDQYGgwNhsbQYGgwNBgaQ4OhwdBgaDA0hgZDg6HB0GBoDA2GBkODocHQGBoMDYYGQ4OhMTQYGgwNhgZDY2gwNBgaDA2GxtBgaDA0GBoMjaHB0GBoMDSGBkODocHQYGgMDYYGQ4OhwdAYGgwNhgZDg6ExNBgaDA2GBkNjaDA0GBoMDYbG0GBoMDQYGgyNocHQYGgwNIYGQ4OhwdBgaAwNhgZDg6HB0BgaDA2GBkPDbQH4OQSN0W8qegAAAABJRU5ErkJggg==';
};

export const getDownloadUrlInfo = (resource) => {
    const hrefUrl = { url: resource?.href, ajaxSafe: false };
    if (isDocumentExternalSource(resource)) {
        return hrefUrl;
    }
    if (!isEmpty(resource?.download_urls)) {
        const downloadData = resource.download_urls.length === 1
            ? resource.download_urls[0]
            : resource.download_urls.find((d) => d.default);
        if (!isEmpty(downloadData)) {
            return { url: downloadData.url, ajaxSafe: downloadData.ajax_safe };
        }
    }
    return hrefUrl;
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

export const onDeleteRedirectTo = (resources = []) => {
    let redirectUrl = '/';
    if (!isEmpty(resources) && resources?.length === 1) {
        const types = getResourceTypesInfo();
        const { catalogPageUrl } = types[resources[0].resource_type] ?? {};
        if (catalogPageUrl) {
            redirectUrl = catalogPageUrl;
        }
    }
    return redirectUrl;
};
