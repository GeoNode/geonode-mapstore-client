/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { setChildFilters } from '../SearchUtils';

describe('Search Utils', () => {

    it('should set child filters along with their parents', () => {
        const item = {
            id: 'store-raster',
            parentId: 'dataset'
        };
        const filters = ['store-time-series'];
        expect(setChildFilters(filters, item)).toEqual(['store-time-series', 'store-raster', 'dataset']);
    });
    it('should not set a parent filter again when it already exists', () => {
        const item = {
            id: 'store-raster',
            parentId: 'dataset'
        };
        const filters = ['store-time-series', 'dataset'];
        expect(setChildFilters(filters, item)).toEqual(['store-time-series', 'dataset', 'store-raster']);
    });
});
