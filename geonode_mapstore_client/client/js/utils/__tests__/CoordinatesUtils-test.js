
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    bboxToPolygon
} from '../CoordinatesUtils';

describe('Test Coordinates Utils', () => {
    it.only('should keep the wms params from the url if available', () => {
        const bbox = {
            bounds: {minx: -10, miny: -10, maxx: 10, maxy: 10},
            crs: 'EPSG:4326'
        };
        const polygon = bboxToPolygon(bbox, 'EPSG:4326');
        expect(polygon.type).toBe('Polygon');
        expect(polygon.coordinates).toEqual([[
            [-10, -10],
            [10, -10],
            [10, 10],
            [-10, 10],
            [-10, -10]
        ]]);
    });
});
