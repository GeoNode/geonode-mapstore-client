/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    mapSaveSelector
} from '../mapsave';

describe('mapsave selector', () => {
    it('should keep the available styles property', () => {
        const state = {
            map: {
                present: {}
            },
            layers: {
                flat: [{ id: '01', availableStyles: [{ name: 'style' }] }]
            }
        };
        const data = mapSaveSelector(state);
        expect(data.map.layers[0].availableStyles).toEqual([
            { name: 'style' }
        ]);
    });
});
