
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    resourceToLayerConfig,
    getResourcePermissions,
    availableResourceTypes,
    setAvailableResourceTypes,
    getGeoNodeMapLayers,
    toGeoNodeMapConfig,
    compareBackgroundLayers,
    toMapStoreMapConfig,
    parseStyleName,
    canCopyResource,
    excludeDeletedResources
} from '../ResourceUtils';

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
        expect(newLayer.params).toEqual({ map: 'name', map_resolution: '91' });
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
                        {
                            name: 'none',
                            label: 'None'
                        },
                        {
                            name: 'view',
                            label: 'View'
                        }
                    ]
                }
            }
        }];
        const permissionOptions = getResourcePermissions(data[0].allowed_perms.compact);
        expect(permissionOptions).toEqual({
            test1: [
                { value: 'none', labelId: `gnviewer.nonePermission`, label: 'None' },
                { value: 'view', labelId: `gnviewer.viewPermission`, label: 'View' }
            ]
        });
    });

    it('should setAvailableResourceTypes', () => {
        setAvailableResourceTypes({ test: 'test data' });

        expect(availableResourceTypes).toEqual({ test: 'test data' });
    });
    it('should convert data blob to geonode maplayers', () => {
        const data = {
            map: {
                layers: [
                    { id: '01', type: 'osm', source: 'osm' },
                    { id: '02', type: 'vector', features: [] },
                    {
                        id: '03',
                        type: 'wms',
                        name: 'geonode:layer',
                        url: 'geoserver/wms',
                        style: 'geonode:style',
                        availableStyles: [{ name: 'custom:style', title: 'My Style', format: 'css', metadata: {} }],
                        extendedParams: {
                            mapLayer: {
                                pk: 10
                            }
                        }
                    }
                ]
            }
        };
        const mapLayers = getGeoNodeMapLayers(data);
        expect(mapLayers.length).toBe(1);
        expect(mapLayers[0]).toEqual({
            pk: 10,
            extra_params: {
                msId: '03',
                styles: [{ name: 'custom:style', title: 'My Style', format: 'css' }]
            },
            current_style: 'geonode:style',
            name: 'geonode:layer'
        });
    });
    it('should convert data blob to geonode map properties', () => {
        const data = {
            map: {
                projection: 'EPSG:3857',
                layers: [
                    { id: '01', type: 'osm', source: 'osm' },
                    { id: '02', type: 'vector', features: [] },
                    {
                        id: '03',
                        type: 'wms',
                        name: 'geonode:layer',
                        url: 'geoserver/wms',
                        style: 'geonode:style',
                        availableStyles: [{ name: 'custom:style', title: 'My Style' }],
                        extendedParams: {
                            mapLayer: {
                                pk: 10
                            }
                        }
                    }
                ]
            }
        };
        const mapState = {
            bbox: {
                bounds: { minx: -10, miny: -10, maxx: 10, maxy: 10 },
                crs: 'EPSG:4326'
            }
        };
        const geoNodeMapConfig = toGeoNodeMapConfig(data, mapState);
        expect(geoNodeMapConfig.maplayers.length).toBe(1);
        expect(geoNodeMapConfig.srid).toBe('EPSG:3857');
        expect(geoNodeMapConfig.bbox_polygon).toBeTruthy();
        expect(geoNodeMapConfig.ll_bbox_polygon).toBeTruthy();
    });
    it('should be able to compare background layers with different ids', () => {
        expect(compareBackgroundLayers({ type: 'osm', source: 'osm', id: '11' }, { type: 'osm', source: 'osm' })).toBe(true);
    });
    it('should transform a resource to a mapstore map config', () => {
        const resource = {
            maplayers: [
                {
                    pk: 10,
                    current_style: 'geonode:style01',
                    extra_params: {
                        msId: '03'
                    },
                    dataset: {
                        pk: 1
                    }
                }
            ],
            data: {
                map: {
                    layers: [
                        { id: '01', type: 'osm', source: 'osm', group: 'background', visibility: true },
                        { id: '02', type: 'vector', features: [] },
                        {
                            id: '03',
                            type: 'wms',
                            name: 'geonode:layer',
                            url: 'geoserver/wms',
                            style: 'geonode:style',
                            extendedParams: {
                                mapLayer: {
                                    pk: 10
                                }
                            }
                        }
                    ]
                }
            }
        };
        const baseConfig = {
            map: {
                layers: [
                    { type: 'osm', source: 'osm', group: 'background', visibility: true }
                ]
            }
        };
        const mapStoreMapConfig = toMapStoreMapConfig(resource, baseConfig);
        expect(mapStoreMapConfig).toEqual(
            {
                map: {
                    sources: {},
                    layers: [
                        { type: 'osm', source: 'osm', group: 'background', visibility: true },
                        { id: '02', type: 'vector', features: [] },
                        {
                            id: '03',
                            type: 'wms',
                            name: 'geonode:layer',
                            url: 'geoserver/wms',
                            style: 'geonode:style01',
                            extendedParams: {
                                mapLayer: {
                                    pk: 10,
                                    current_style: 'geonode:style01',
                                    extra_params: {
                                        msId: '03'
                                    },
                                    dataset: {
                                        pk: 1
                                    }
                                }
                            },
                            availableStyles: [],
                            featureInfo: { template: '' }
                        }
                    ]
                }
            }
        );
    });
    it('should transform a resource to a mapstore map config', () => {
        const resource = {
            maplayers: [
                {
                    pk: 10,
                    current_style: 'geonode:style01',
                    extra_params: {
                        msId: '03'
                    },
                    dataset: {
                        pk: 1
                    }
                }
            ],
            data: {
                map: {
                    layers: [
                        { id: '01', type: 'osm', source: 'osm', group: 'background', visibility: true },
                        { id: '02', type: 'vector', features: [] },
                        {
                            id: '03',
                            type: 'wms',
                            name: 'geonode:layer',
                            url: 'geoserver/wms',
                            style: 'geonode:style',
                            extendedParams: {
                                mapLayer: {
                                    pk: 10
                                }
                            }
                        }
                    ]
                }
            }
        };
        const baseConfig = {
            map: {
                layers: [
                    { type: 'osm', source: 'osm', group: 'background', visibility: true }
                ]
            }
        };
        const mapStoreMapConfig = toMapStoreMapConfig(resource, baseConfig);
        expect(mapStoreMapConfig).toEqual(
            {
                map: {
                    sources: {},
                    layers: [
                        { type: 'osm', source: 'osm', group: 'background', visibility: true },
                        { id: '02', type: 'vector', features: [] },
                        {
                            id: '03',
                            type: 'wms',
                            name: 'geonode:layer',
                            url: 'geoserver/wms',
                            style: 'geonode:style01',
                            extendedParams: {
                                mapLayer: {
                                    pk: 10,
                                    current_style: 'geonode:style01',
                                    extra_params: {
                                        msId: '03'
                                    },
                                    dataset: {
                                        pk: 1
                                    }
                                }
                            },
                            availableStyles: [],
                            featureInfo: { template: '' }
                        }
                    ]
                }
            }
        );
    });
    it('should transform a resource to a mapstore map config and update backgrounds', () => {
        const resource = {
            maplayers: [
                {
                    pk: 10,
                    current_style: 'geonode:style01',
                    extra_params: {
                        msId: '03'
                    },
                    dataset: {
                        pk: 1
                    }
                }
            ],
            data: {
                map: {
                    layers: [
                        { id: '01', type: 'osm', source: 'osm', group: 'background', visibility: true },
                        { id: '02', type: 'vector', features: [] },
                        {
                            id: '03',
                            type: 'wms',
                            name: 'geonode:layer',
                            url: 'geoserver/wms',
                            style: 'geonode:style',
                            extendedParams: {
                                mapLayer: {
                                    pk: 10
                                }
                            }
                        }
                    ]
                }
            }
        };
        const baseConfig = {
            map: {
                layers: [
                    {
                        name: 'OpenTopoMap',
                        provider: 'OpenTopoMap',
                        source: 'OpenTopoMap',
                        type: 'tileprovider',
                        visibility: true,
                        group: 'background'
                    }
                ]
            }
        };
        const mapStoreMapConfig = toMapStoreMapConfig(resource, baseConfig);
        expect(mapStoreMapConfig).toEqual(
            {
                map: {
                    sources: {},
                    layers: [
                        {
                            name: 'OpenTopoMap',
                            provider: 'OpenTopoMap',
                            source: 'OpenTopoMap',
                            type: 'tileprovider',
                            visibility: true,
                            group: 'background'
                        },
                        { id: '02', type: 'vector', features: [] },
                        {
                            id: '03',
                            type: 'wms',
                            name: 'geonode:layer',
                            url: 'geoserver/wms',
                            style: 'geonode:style01',
                            extendedParams: {
                                mapLayer: {
                                    pk: 10,
                                    current_style: 'geonode:style01',
                                    extra_params: {
                                        msId: '03'
                                    },
                                    dataset: {
                                        pk: 1
                                    }
                                }
                            },
                            availableStyles: [],
                            featureInfo: { template: '' }
                        }
                    ]
                }
            }
        );
    });

    it('should parse style name into accepted format', () => {
        const styleObj = {
            name: 'testName',
            workspace: 'test'
        };

        const pasrsedStyleName = parseStyleName(styleObj);

        expect(pasrsedStyleName).toBe('test:testName');
    });

    it('should test canCopyResource', () => {
        const resource = { is_copyable: true };
        const user = { perms: ['add_resource'] };

        expect(canCopyResource(resource, user)).toEqual(true);
    });

    it('should test excludeDeletedResources', () => {
        const resources = [{ name: 'test-1', processes: [{ processType: 'deleteResource', output: { status: 'finished' } }] },
            { name: 'test-2' }];

        expect(excludeDeletedResources(resources)).toEqual([{ name: 'test-2' }]);
    });
});
