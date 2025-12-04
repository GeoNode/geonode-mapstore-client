/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


import uuid from 'uuid';
import { getDocumentByPk } from '@js/api/geonode/v2';
import isEmpty from "lodash/isEmpty";
import { getPolygonFromExtent } from "@mapstore/framework/utils/CoordinatesUtils";
import turfCenter from "@turf/center";


const calculateBbox = (coordinates) => {
    if (!coordinates || coordinates.length === 0) {
        return null;
    }
    const validCoords = coordinates.filter(coord => coord && coord.length === 2);
    if (validCoords.length === 0) {
        return null;
    }
    const lons = validCoords.map(coord => coord[0]);
    const lats = validCoords.map(coord => coord[1]);
    return {
        bounds: {
            minx: Math.min(...lons),
            miny: Math.min(...lats),
            maxx: Math.max(...lons),
            maxy: Math.max(...lats)
        },
        crs: "EPSG:4326"
    };
};

export const documentsToLayerConfig = (documents) => {
    const documentPromises = documents.map(doc => getDocumentByPk(doc.pk));
    const unId = uuid();

    return Promise.all(documentPromises).then(fullDocs => {
        const extendedParams = {};

        const features = fullDocs
            .map((doc) => {
                const extent = doc?.extent?.coords;
                const polygon = !isEmpty(extent) ? getPolygonFromExtent(extent) : null;
                const center = !isEmpty(extent) && polygon ? turfCenter(polygon) : null;
                if (!center) {
                    return null;
                }

                return {
                    type: "Feature",
                    properties: {
                        pk: doc.pk,
                        title: doc.title,
                        "abstract": doc.abstract,
                        detail_url: doc.detail_url,
                        embed_url: doc.embed_url,
                        uuid: doc.uuid
                    },
                    geometry: {
                        type: "Point",
                        coordinates: center.geometry.coordinates
                    },
                    id: doc.pk
                };
            })
            .filter(feature => feature !== null);

        const allCoordinates = features.map(f => f.geometry.coordinates);
        const bbox = calculateBbox(allCoordinates);

        return {
            type: "vector",
            visibility: true,
            id: 'documents:' + unId,
            name: "Documents",
            ...(bbox && { bbox }),
            extendedParams: extendedParams,
            features,
            style: {
                format: "geostyler",
                metadata: {
                    editorType: "visual"
                },
                body: {
                    rules: [
                        {
                            name: "Default Point Style",
                            ruleId: 'documents:' + unId,
                            symbolizers: [
                                {
                                    kind: "Mark",
                                    color: "#0000ff",
                                    fillOpacity: 0.1,
                                    opacity: 1,
                                    strokeColor: "#0000ff",
                                    strokeOpacity: 1,
                                    strokeWidth: 3,
                                    wellKnownName: "Circle",
                                    radius: 10,
                                    msBringToFront: true,
                                    symbolizerId: "documents:" + unId
                                }
                            ]
                        }
                    ]
                }
            },
            featureInfo: {
                format: "TEMPLATE",
                template: `
                    <div style="width: 100%; aspect-ratio: 16/9;">
                        <h3>\${properties['title']}</h3>
                        <p>\${properties['abstract']}</p>
                        <iframe 
                            key="\${properties['embed_url']}"
                            src="\${properties['embed_url']}" 
                            style="width: 100%; height: 100%;"
                            frameborder="0"
                            sandbox="allow-scripts allow-same-origin"
                            allowfullscreen>
                        </iframe>
                    </div>
                `
            }
        };
    });
};

                  