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
        name: 'Dataset'
    },
    [ResourceTypes.MAP]: {
        icon: 'map',
        name: 'Map',
        formatEmbedUrl: (resource) => parseDevHostname(updateUrlQueryParameter(resource.embed_url, {
            config: 'map_preview',
            theme: 'preview'
        })),
        formatDetailUrl: (resource) => (`/catalogue/#/map/${resource.pk}`)
    },
    [ResourceTypes.DOCUMENT]: {
        icon: 'file',
        name: 'Document',
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => (`/catalogue/#/document/${resource.pk}`)
    },
    [ResourceTypes.GEOSTORY]: {
        icon: 'book',
        name: 'GeoStory',
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => (`/catalogue/#/geostory/${resource.pk}`)
    },
    [ResourceTypes.DASHBOARD]: {
        icon: 'dashboard',
        name: 'Dashboard',
        formatEmbedUrl: (resource) => resource?.embed_url && parseDevHostname(resource.embed_url),
        formatDetailUrl: (resource) => (`/catalogue/#/dashboard/${resource.pk}`)
    }
});
