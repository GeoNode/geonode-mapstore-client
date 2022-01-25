
/*
 * Copyright 2019, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import isNil from 'lodash/isNil';
import join from 'lodash/join';
import { reprojectBbox, getViewportGeometry } from '@mapstore/framework/utils/CoordinatesUtils';
import turfBbox from '@turf/bbox';

/**
* Utilities for api requests
* @module utils/CoordinatesUtils
*/

export const getBBOX = (extent) => {
    const [minx, miny, maxx, maxy] = extent;
    return {
        crs: 'EPSG:4326',
        bounds: {
            minx: !isNil(minx) && parseFloat(minx) || -180,
            miny: !isNil(miny) && parseFloat(miny) || -90,
            maxx: !isNil(maxx) && parseFloat(maxx) || 180,
            maxy: !isNil(maxy) && parseFloat(maxy) || 90
        }
    };
};

export const getFeatureFromExtent = (extent) => {
    const [
        aMinx, aMiny, aMaxx, aMaxy,
        bMinx, bMiny, bMaxx, bMaxy
    ] = extent
        .split(',')
        .map((val) => parseFloat(val));
    return {
        type: 'Feature',
        geometry: {
            type: 'MultiPolygon',
            coordinates: [
                [
                    [
                        [aMinx, aMiny],
                        [aMinx, aMaxy],
                        [aMaxx, aMaxy],
                        [aMaxx, aMiny],
                        [aMinx, aMiny]
                    ]
                ],

                ...(bMinx && bMiny && bMaxx && bMaxy
                    ?

                    [
                        [
                            [
                                [bMinx, bMiny],
                                [bMinx, bMaxy],
                                [bMaxx, bMaxy],
                                [bMaxx, bMiny],
                                [bMinx, bMiny]
                            ]
                        ]
                    ]

                    : [])]

        },
        properties: {}
    };
};

export const extentStringToBounds = (extentString) => {
    const extent = extentString.split(',').map(val => parseFloat(val));
    return {
        crs: 'EPSG:4326',
        bounds: {
            minx: extent[0],
            miny: extent[1],
            maxx: extent[2],
            maxy: extent[3]
        }
    };
};
/**
 * Given a bounds { minx, miny, maxx, maxy } and a crs return the extent param as string
 * @return {string} extent param
 */
export const boundsToExtentString = (bounds, fromCrs) => {
    const { extent } = getViewportGeometry(bounds, fromCrs);
    const extents = extent.length === 2
        ? extent
        : [ extent ];
    const reprojectedExtents = fromCrs === 'EPSG:4326'
        ? extents
        : extents.map(ext => reprojectBbox(ext, fromCrs, 'EPSG:4326'));
    return join(reprojectedExtents.map(ext => join(ext.map((val) => val.toFixed(4)), ',')), ',');
};


export function bboxToPolygon(bbox, crs) {
    const { minx, miny, maxx, maxy } = bbox.bounds;
    const extent = [minx, miny, maxx, maxy];
    const llExtent = bbox.crs === crs
        ? extent
        : reprojectBbox(extent, bbox.crs, crs);
    const [minxLL, minyLL, maxxLL, maxyLL] = llExtent;
    return {
        type: 'Polygon',
        // coordinates direction counter-clockwise
        coordinates: [[
            [minxLL, minyLL],
            [maxxLL, minyLL],
            [maxxLL, maxyLL],
            [minxLL, maxyLL],
            [minxLL, minyLL]
        ]]
    };
}

/**
 * Get the extent of area of interest from map bbox
 * the values of the extent are expressed in the unit of the projection
 * @param {Object} Options containing layers and features
 * @returns {Array} containng minx, miny, maxx, maxy
 * minx, miny -> bottom-left corner of square
 * maxx, maxy -> top-right corner of square
 */
export const getExtent = ({
    features,
    layers
}) => {
    if (features && features.length > 0) {
        return turfBbox({ type: 'FeatureCollection', features });
    }
    const { bbox } = layers.find(({ isDataset }) => isDataset) || {};
    const { bounds, crs } = bbox || {};
    if (bounds && crs === 'EPSG:4326') {
        const { minx, miny, maxx, maxy } = bounds;
        return [minx, miny, maxx, maxy];
    }
    return null;
};
