/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Observable } from 'rxjs';
import {
    getMaps,
    getDocumentsByDocType,
    getMapByPk
} from '@js/api/geonode/v2';
import { parseMapConfig, parseDocumentConfig } from '@js/utils/ResourceUtils';

/**
 * Get promise of Image dimensions
 * @param {string} src geostory image source (href)
 * @returns {Promise}
 */
function getImageDimensions(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            resolve({
                imgWidth: img.naturalWidth,
                imgHeight: img.naturalHeight
            });
        };
        img.onerror = () => {
            resolve({});
        };
        img.src = src;
    });
}

const loadMediaList = {
    image: ({
        page,
        pageSize,
        q,
        selectedId,
        sourceId
    }) => getDocumentsByDocType('image', {
        page,
        pageSize,
        q
    })
        .then((response) => {
            const totalCount = response.totalCount || 0;
            const resources = response.resources.map((resource) => {
                const newResource = { ...resource, sourceId };
                return {
                    id: resource.pk,
                    type: 'image',
                    data: parseDocumentConfig(newResource)
                };
            });
            const selectedResource = resources.find((resource) => resource.id === selectedId);
            if (selectedResource) {
                // get resource data when it's selected
                // this will allow to preview the map and retrieve the correct data
                return getImageDimensions(selectedResource.data.src)
                    .then((dimensions) => {
                        return {
                            resources: resources.map((resource) => selectedId && resource.id === selectedId
                                ? {
                                    ...resource,
                                    data: {
                                        ...resource.data,
                                        ...dimensions
                                    }
                                }
                                : resource),
                            totalCount
                        };
                    });
            }
            return {
                resources,
                totalCount
            };
        }),
    video: ({
        page,
        pageSize,
        q,
        sourceId
    }) => getDocumentsByDocType('video', {
        page,
        pageSize,
        q
    })
        .then((response) => {
            const totalCount = response.totalCount || 0;
            const resources = response.resources.map((resource) => {
                const newResource = { ...resource, sourceId };
                return {
                    id: resource.pk,
                    type: 'video',
                    data: parseDocumentConfig(newResource)
                };
            });

            return {
                resources,
                totalCount
            };
        }),
    map: ({
        page,
        pageSize,
        q,
        selectedId,
        sourceId
    }) => getMaps({
        page,
        pageSize,
        q
    })
        .then((response) => {
            const totalCount = response.totalCount || 0;
            const resources = response.resources.map((resource) => ({
                id: resource.pk,
                type: 'map',
                data: {
                    thumbnail: resource.thumbnail_url,
                    title: resource.title,
                    description: resource.raw_abstract,
                    id: resource.pk,
                    sourceId
                }
            }));
            const selectedResource = resources.find((resource) => resource.id === selectedId);
            if (selectedResource) {
                // get resource data when it's selected
                // this will allow to preview the map and retrieve the correct data
                return getMapByPk(selectedResource.id)
                    .then((mapResponse) => ({
                        resources: resources.map((resource) => selectedId && resource.id === selectedId
                            ? {
                                ...resource,
                                data: parseMapConfig(mapResponse, resource)
                            }
                            : resource),
                        totalCount
                    }))
                    .catch(() => ({
                        resources,
                        totalCount
                    }));
            }
            return {
                resources,
                totalCount
            };
        })
};

export const load = ({
    params,
    mediaType,
    sourceId,
    selectedId
}) => {
    const { page, pageSize } = params;
    const emptyResponse = {
        resources: [],
        totalCount: 0
    };
    const mediaListRequest = loadMediaList[mediaType];
    return Observable.defer(() => mediaListRequest({
        page,
        pageSize,
        q: params.q,
        selectedId,
        sourceId
    })
        .then(response => response)
        .catch(() => {
            return emptyResponse;
        }));
};

export const getData = ({ selectedItem }) => {

    if (!selectedItem) {
        return Observable.of(null);
    }

    if (selectedItem.type === 'image'
    && selectedItem.data.src
    && !(selectedItem.data.imgWidth && selectedItem.data.imgHeight)) {
        return Observable.defer(() =>
            getImageDimensions(selectedItem.data.src)
                .then((dimensions) => ({
                    ...selectedItem.data,
                    ...dimensions
                }))
        );
    }

    if (selectedItem.type === 'map'
    && selectedItem.data && selectedItem.data.id) {
        return Observable.defer(() => getMapByPk(selectedItem.data.id)
            .then((response) => {
                return parseMapConfig(response, selectedItem);
            }));
    }

    return Observable.of(null);
};
