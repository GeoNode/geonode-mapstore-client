
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
    excludeDeletedResources,
    processUploadResponse,
    parseUploadResponse,
    cleanUrl,
    parseUploadFiles
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

    it('should test processUploadResponse', () => {
        const prev = [{
            id: 1,
            name: 'test1',
            create_date: '2022-04-13T11:24:55.444578Z',
            state: 'PENDING',
            progress: 0,
            complete: false
        },
        {
            id: 2,
            name: 'test2',
            create_date: '2022-04-13T11:24:54.042291Z',
            state: 'PENDING',
            progress: 0,
            complete: false
        },
        {
            id: 3,
            name: 'test3',
            create_date: '2022-04-13T11:24:54.042291Z',
            state: 'PENDING',
            progress: 20,
            complete: false
        }];
        const current = [{
            id: 1,
            name: 'test1',
            create_date: '2022-04-13T11:24:55.444578Z',
            state: 'RUNNING',
            progress: 100,
            complete: true
        },
        {
            id: 2,
            name: 'test2',
            create_date: '2022-04-13T11:24:54.042291Z',
            state: 'PENDING',
            progress: 40,
            complete: false,
            resume_url: 'test/upload/delete/439'
        },
        {
            id: 3,
            name: 'test3',
            create_date: '2022-04-13T11:24:54.042291Z',
            state: 'COMPLETE',
            progress: 100,
            complete: true
        },
        {
            id: 4,
            name: 'test4',
            create_date: '2022-04-13T11:24:54.042291Z',
            state: 'COMPLETE',
            progress: 100,
            complete: true
        },
        {
            exec_id: 23,
            name: 'test3',
            created: '2022-05-13T12:24:54.042291Z',
            status: 'running',
            complete: false
        }];

        expect(processUploadResponse([...prev, ...current])).toEqual([
            {
                exec_id: 23,
                name: 'test3',
                created: '2022-05-13T12:24:54.042291Z',
                status: 'running',
                complete: false,
                create_date: '2022-05-13T12:24:54.042291Z',
                id: 23
            },
            {
                id: 1,
                name: 'test1',
                create_date: '2022-04-13T11:24:55.444578Z',
                state: 'RUNNING',
                progress: 100,
                complete: true
            },
            {
                id: 4,
                name: 'test4',
                create_date: '2022-04-13T11:24:54.042291Z',
                state: 'COMPLETE',
                progress: 100,
                complete: true
            },
            {
                id: 3,
                name: 'test3',
                create_date: '2022-04-13T11:24:54.042291Z',
                state: 'COMPLETE',
                progress: 100,
                complete: true
            },
            {
                id: 2,
                name: 'test2',
                create_date: '2022-04-13T11:24:54.042291Z',
                state: 'PENDING',
                progress: 40,
                complete: false,
                resume_url: 'test/upload/delete/439'
            }
        ]);
    });

    it('should test parseUploadResponse', () => {
        const uploads = [
            {
                id: 3,
                name: 'test3',
                create_date: '2022-04-13T11:24:54.042291Z',
                state: 'COMPLETE',
                progress: 100,
                complete: true
            },
            {
                id: 2,
                name: 'test2',
                create_date: '2022-04-13T12:24:54.042291Z',
                state: 'PENDING',
                progress: 40,
                complete: false,
                resume_url: 'test/upload/delete/439'
            }
        ];

        expect(parseUploadResponse(uploads)).toEqual([
            {
                id: 2,
                name: 'test2',
                create_date: '2022-04-13T12:24:54.042291Z',
                state: 'PENDING',
                progress: 40,
                complete: false,
                resume_url: 'test/upload/delete/439'
            },
            {
                id: 3,
                name: 'test3',
                create_date: '2022-04-13T11:24:54.042291Z',
                state: 'COMPLETE',
                progress: 100,
                complete: true
            }
        ]);
    });

    it('should clean url', () => {
        const testUrl = 'https://test.com/dataset/808?filter=time';

        const url = cleanUrl(testUrl);

        expect(url).toEqual('https://test.com/dataset/808');
    });

    it('should parse upload files', () => {
        const data = {
            uploadFiles: {
                TestFile: {
                    type: 'shp',
                    files: {
                        dbf: { name: "TestFile.dbf" },
                        prj: { name: "TestFile.prj" },
                        shp: { name: "TestFile.shp" },
                        shx: { name: "TestFile.shx" },
                        sld: { name: "TestFile.sld" },
                        xml: { name: "TestFile.xml" }
                    }
                }
            },
            supportedDatasetTypes: [
                {
                    id: 'shp',
                    label: 'ESRI Shapefile',
                    format: 'vector',
                    ext: ['shp'],
                    requires: ['shp', 'prj', 'dbf', 'shx'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'tiff',
                    label: 'GeoTIFF',
                    format: 'raster',
                    ext: ['tiff', 'tif'],
                    mimeType: ['image/tiff'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'csv',
                    label: 'Comma Separated Value (CSV)',
                    format: 'vector',
                    ext: ['csv'],
                    mimeType: ['text/csv'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'zip',
                    label: 'Zip Archive',
                    format: 'archive',
                    ext: ['zip'],
                    mimeType: ['application/zip'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'xml',
                    label: 'XML Metadata File',
                    format: 'metadata',
                    ext: ['xml'],
                    mimeType: ['application/json'],
                    needsFiles: [
                        'shp',
                        'prj',
                        'dbf',
                        'shx',
                        'csv',
                        'tiff',
                        'zip',
                        'sld'
                    ]
                },
                {
                    id: 'sld',
                    label: 'Styled Layer Descriptor (SLD)',
                    format: 'metadata',
                    ext: ['sld'],
                    mimeType: ['application/json'],
                    needsFiles: [
                        'shp',
                        'prj',
                        'dbf',
                        'shx',
                        'csv',
                        'tiff',
                        'zip',
                        'xml'
                    ]
                }
            ],
            supportedOptionalExtensions: [
                'xml',
                'sld',
                'xml',
                'sld',
                'xml',
                'sld',
                'xml',
                'sld'
            ],
            supportedRequiresExtensions: ['shp', 'prj', 'dbf', 'shx']
        };

        expect(parseUploadFiles(data)).toEqual({
            TestFile: {
                type: "shp",
                files: {
                    dbf: { name: "TestFile.dbf" },
                    prj: { name: "TestFile.prj" },
                    shp: { name: "TestFile.shp" },
                    shx: { name: "TestFile.shx" },
                    sld: { name: "TestFile.sld" },
                    xml: { name: "TestFile.xml" }
                },
                mainExt: "shp",
                missingExt: [],
                addMissingFiles: false
            }
        });
    });

    it('request for missing files', () => {
        const data = {
            uploadFiles: {
                TestFile: {
                    type: 'xml',
                    files: {
                        sld: { name: "TestFile.sld" },
                        xml: { name: "TestFile.xml" }
                    }
                }
            },
            supportedDatasetTypes: [
                {
                    id: 'shp',
                    label: 'ESRI Shapefile',
                    format: 'vector',
                    ext: ['shp'],
                    requires: ['shp', 'prj', 'dbf', 'shx'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'tiff',
                    label: 'GeoTIFF',
                    format: 'raster',
                    ext: ['tiff', 'tif'],
                    mimeType: ['image/tiff'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'csv',
                    label: 'Comma Separated Value (CSV)',
                    format: 'vector',
                    ext: ['csv'],
                    mimeType: ['text/csv'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'zip',
                    label: 'Zip Archive',
                    format: 'archive',
                    ext: ['zip'],
                    mimeType: ['application/zip'],
                    optional: ['xml', 'sld']
                },
                {
                    id: 'xml',
                    label: 'XML Metadata File',
                    format: 'metadata',
                    ext: ['xml'],
                    mimeType: ['application/json'],
                    needsFiles: [
                        'shp',
                        'prj',
                        'dbf',
                        'shx',
                        'csv',
                        'tiff',
                        'zip',
                        'sld'
                    ]
                },
                {
                    id: 'sld',
                    label: 'Styled Layer Descriptor (SLD)',
                    format: 'metadata',
                    ext: ['sld'],
                    mimeType: ['application/json'],
                    needsFiles: [
                        'shp',
                        'prj',
                        'dbf',
                        'shx',
                        'csv',
                        'tiff',
                        'zip',
                        'xml'
                    ]
                }
            ],
            supportedOptionalExtensions: [
                'xml',
                'sld',
                'xml',
                'sld',
                'xml',
                'sld',
                'xml',
                'sld'
            ],
            supportedRequiresExtensions: ['shp', 'prj', 'dbf', 'shx']
        };

        const parsedFiles = parseUploadFiles(data);
        const baseName = 'TestFile';

        expect(parsedFiles[baseName].addMissingFiles).toEqual(true);
    });
});
