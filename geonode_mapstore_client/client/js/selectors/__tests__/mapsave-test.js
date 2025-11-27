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
    it ('should filter out layers with documents: in their id', () => {
    const state = {
        map: {
            present: {
            }
        },
        layers: {
            flat: [
                { id: '01', availableStyles: [{ name: 'style1' }] },
                { id: 'documents:e94cf157-2b09-4877-a35a-1f7824c2bd6a', availableStyles: [] },
                { id: '02', availableStyles: [{ name: 'style2' }] },
                { id: 'documents:28adadf1-456d-4ab3-9336-ff600284226e', availableStyles: [] }
            ]
        }
    };
    const data = mapSaveSelector(state);

    expect(data.map.layers.length).toBe(2);
    expect(data.map.layers[0].id).toBe('01');
    expect(data.map.layers[1].id).toBe('02');
    
    const hasDocumentLayers = data.map.layers.some(layer => 
        layer.id && layer.id.includes('documents:')
    );
    expect(hasDocumentLayers).toBe(false);
    });
});
