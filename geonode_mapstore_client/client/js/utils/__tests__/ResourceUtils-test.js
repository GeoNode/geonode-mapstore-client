
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { resourceToLayerConfig } from '../ResourceUtils';

describe('Test Resource Utils', () => {
    it('should keep the wms params from the url if available', () => {
        const newLayer = resourceToLayerConfig({
            alternate: 'geonode:layer_name',
            links: [{
                extension: 'html',
                link_type: 'OGC:WMS',
                name: 'OGC WMS Service',
                mime: 'text/html',
                url: 'http://localhost:8080/geoserver/wms?map=name&map_resolution=91'
            }],
            title: 'Layer title',
            perms: [],
            pk: 1
        });
        expect(newLayer.params).toEqual({ map: 'name', map_resolution: '91' } );
    });
});
