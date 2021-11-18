
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { resourceToLayerConfig, getResourcePermissions, availableResourceTypes, setAvailableResourceTypes } from '../ResourceUtils';

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

    it('should parse arcgis dataset', () => {
        const newLayer = resourceToLayerConfig({
            alternate: 'remoteWorkspace:1',
            title: 'Layer title',
            perms: [],
            links: [{
                extension: 'html',
                link_type: 'image',
                mime: 'text/html',
                name: 'ArcGIS REST ImageServer',
                url: 'http://localhost:8080/MapServer'
            }],
            pk: 1,
            ptype: 'gxp_arcrestsource'
        });
        expect(newLayer.type).toBe('arcgis');
        expect(newLayer.name).toBe('1');
        expect(newLayer.url).toBe('http://localhost:8080/MapServer');
    });

    it('should getViewedResourcePermissions', () => {
        const data = [{
            name: "testType",
            allowed_perms: {
                compact: {
                    test1: [
                        "none",
                        "view"
                    ]
                }
            }
        }];
        const permissionOptions = getResourcePermissions(data[0].allowed_perms.compact);
        expect(permissionOptions).toEqual({
            test1: [{ value: 'none', labelId: `gnviewer.nonePermission` },
                { value: 'view', labelId: `gnviewer.viewPermission` }
            ]
        });
    });

    it('should setAvailableResourceTypes', () => {
        setAvailableResourceTypes({ test: 'test data' });

        expect(availableResourceTypes).toEqual({ test: 'test data' });
    });
});
