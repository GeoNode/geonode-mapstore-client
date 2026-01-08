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
import { GEONODE_DOCUMENTS_ROW_VIEWER } from '../constants';


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
                    properties: doc,
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
            id: uuid(),
            name: "Documents",
            title: "Documents",
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
                            "name": "Videos",
                            "filter": ["&&", [
                                "==",
                                "subtype",
                                "video"
                            ]],
                            "ruleId": "01",
                            "mandatory": false,
                            "symbolizers": [
                                {
                                    "kind": "Icon",
                                    "size": 46,
                                    "image": {
                                        "args": [
                                            {
                                                "color": "blue",
                                                "glyph": "video-camera",
                                                "shape": "circle"
                                            }
                                        ],
                                        "name": "msMarkerIcon"
                                    },
                                    "anchor": "bottom",
                                    "rotate": 0,
                                    "opacity": 1,
                                    "symbolizerId": "01",
                                    "msBringToFront": false,
                                    "msHeightReference": "none"
                                }
                            ]
                        },
                        {
                            "name": "Images",
                            "filter": ["&&", [
                                "==",
                                "subtype",
                                "image"
                            ]],
                            "ruleId": "02",
                            "mandatory": false,
                            "symbolizers": [
                                {
                                    "kind": "Icon",
                                    "size": 46,
                                    "image": {
                                        "args": [
                                            {
                                                "color": "blue",
                                                "glyph": "camera",
                                                "shape": "circle"
                                            }
                                        ],
                                        "name": "msMarkerIcon"
                                    },
                                    "anchor": "bottom",
                                    "rotate": 0,
                                    "opacity": 1,
                                    "symbolizerId": "01",
                                    "msBringToFront": false,
                                    "msHeightReference": "none"
                                }
                            ]
                        },
                        {
                            "name": "Files",
                            "filter": ["&&", [
                                "!=",
                                "subtype",
                                "image"
                            ], [
                                "!=",
                                "subtype",
                                "video"
                            ]],
                            "ruleId": "03",
                            "mandatory": false,
                            "symbolizers": [
                                {
                                    "kind": "Icon",
                                    "size": 46,
                                    "image": {
                                        "args": [
                                            {
                                                "color": "blue",
                                                "glyph": "file",
                                                "shape": "circle"
                                            }
                                        ],
                                        "name": "msMarkerIcon"
                                    },
                                    "anchor": "bottom",
                                    "rotate": 0,
                                    "opacity": 1,
                                    "symbolizerId": "01",
                                    "msBringToFront": false,
                                    "msHeightReference": "none"
                                }
                            ]
                        }
                    ]
                }
            },
            rowViewer: GEONODE_DOCUMENTS_ROW_VIEWER
        };
    });
};

