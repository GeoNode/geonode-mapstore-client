/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    getViewedResourceType,
    isNewResource,
    isNewResourcePk,
    getGeoNodeResourceDataFromGeoStory,
    getGeoNodeResourceFromDashboard,
    getResourceThumbnail,
    updatingThumbnailResource,
    isThumbnailChanged,
    canEditPermissions,
    canManageResourcePermissions,
    isNewMapDirty,
    isNewDashboardDirty,
    isNewGeoStoryDirty,
    defaultViewerPluginsSelector
} from '../resource';
import { ResourceTypes } from '@js/utils/ResourceUtils';

const testState = {
    gnresource: {
        type: 'testResource',
        isNew: true,
        data: {
            thumbnailChanged: true,
            thumbnail_url: 'thumbnail.jpeg',
            updatingThumbnail: true
        },
        compactPermissions: {
            groups: [{name: 'test-group', permissions: 'manage'}]
        }
    },
    geostory: {
        currentStory: {
            resources: [{data: {sourceId: 'geonode'}, name: 'test', type: 'map', id: 300}, {data: {sourceId: 'geonode'}, name: 'test', type: 'video', id: 200}, {data: {sourceId: 'geonode'}, name: 'test', type: 'image', id: 100}, {name: 'test2'}]
        }
    },
    dashboard: {
        originalData: {
            widgets: [{widgetType: 'map', name: 'test widget', map: {extraParams: {pk: 1}}}, {widgetType: 'map', name: 'test widget 2', map: {pk: 1}}]
        }
    },
    security: {
        user: {
            info: {
                groups: ['test-group']
            }
        }
    }
};

describe('resource selector', () => {
    it('resource type', () => {
        expect(getViewedResourceType(testState)).toBe('testResource');
    });

    it('is new resource', () => {
        expect(isNewResource(testState)).toBeTruthy();
    });

    it('is new resource by pk', () => {
        let state = {...testState, gnresource: {...testState.gnresource, params: {pk: "new"}}};
        expect(isNewResourcePk(state)).toBeTruthy();
        state.gnresource.params.pk = '1';
        expect(isNewResourcePk(state)).toBeFalsy();
        state.gnresource.params = undefined;
        expect(isNewResourcePk(state)).toBeFalsy();
    });

    it('getGeoNodeResourceDataFromGeoStory', () => {
        expect(getGeoNodeResourceDataFromGeoStory(testState)).toEqual({ maps: [300], documents: [200, 100] });
    });
    it('getGeoNodeResourceFromDashboard', () => {
        expect(getGeoNodeResourceFromDashboard(testState)).toEqual({ maps: [1] });
    });

    it('should get thumbnail change status', () => {
        expect(isThumbnailChanged(testState)).toBeTruthy();
    });

    it('should get resource thumbnail', () => {
        expect(getResourceThumbnail(testState)).toBe('thumbnail.jpeg');
    });

    it('should get resource thumbnail updating status', () => {
        expect(updatingThumbnailResource(testState)).toBeTruthy();
    });

    it('should get permissions from users in groups with manage rights', () => {
        expect(canEditPermissions(testState)).toBeTruthy();
    });
    it('test manage resource permissions', () => {
        let state = {...testState};
        state.gnresource.data.perms = ['change_resourcebase_permissions'];
        expect(canManageResourcePermissions(state)).toBeTruthy();
        state.gnresource.data.perms = ['change_resourcebase', 'view_resourcebase'];
        expect(canManageResourcePermissions(state)).toBeFalsy();
        state.gnresource.data.perms = undefined;
    });
    it('test defaultViewerPluginsSelector', () => {
        let state = {...testState};
        state.gnresource = {...state.gnresource, defaultViewerPlugins: ["TOC"]};
        expect(defaultViewerPluginsSelector(state)).toEqual(["TOC"]);
        state.gnresource = {...state.gnresource, defaultViewerPlugins: undefined};
        expect(defaultViewerPluginsSelector(state)).toEqual([]);
    });

    it('test isNewMapDirty returns false when no mapConfigRawData exists', () => {
        const state = {
            gnresource: {
                type: ResourceTypes.MAP
            },
            map: {
                present: {
                    zoom: 5,
                    center: { x: 0, y: 0, crs: 'EPSG:4326' }
                }
            }
            // No mapConfigRawData
        };
        expect(isNewMapDirty(state)).toBeFalsy();
    });

    it('test isNewMapDirty returns false when map has not changed from initial config', () => {
        const initialConfig = {
            version: 2,
            map: {
                zoom: 5,
                center: { x: 0, y: 0, crs: 'EPSG:4326' },
                layers: [
                    { id: 'layer1', type: 'osm', group: 'background', visibility: true }
                ]
            }
        };
        const state = {
            gnresource: {
                type: ResourceTypes.MAP
            },
            map: {
                present: {
                    zoom: 5,
                    center: { x: 0, y: 0, crs: 'EPSG:4326' },
                    layers: [
                        { id: 'layer1', type: 'osm', group: 'background', visibility: true }
                    ]
                }
            },
            layers: {
                flat: [
                    { id: 'layer1', type: 'osm', group: 'background', visibility: true }
                ]
            },
            mapConfigRawData: initialConfig
        };
        expect(isNewMapDirty(state)).toBeFalsy();
    });

    it('test isNewMapDirty returns true when layers are added', () => {
        const initialConfig = {
            version: 2,
            map: {
                zoom: 5,
                center: { x: 0, y: 0, crs: 'EPSG:4326' },
                layers: [
                    { id: 'layer1', type: 'osm', group: 'background', visibility: true }
                ]
            }
        };
        const state = {
            gnresource: {
                type: ResourceTypes.MAP
            },
            map: {
                present: {
                    zoom: 5,
                    center: { x: 0, y: 0, crs: 'EPSG:4326' },
                    layers: [
                        { id: 'layer1', type: 'osm', group: 'background', visibility: true },
                        { id: 'layer2', type: 'wms', name: 'newLayer', visibility: true }
                    ]
                }
            },
            layers: {
                flat: [
                    { id: 'layer1', type: 'osm', group: 'background', visibility: true },
                    { id: 'layer2', type: 'wms', name: 'newLayer', visibility: true }
                ]
            },
            mapConfigRawData: initialConfig
        };
        expect(isNewMapDirty(state)).toBeTruthy();
    });

    it('test isNewMapDirty ignores ellipsoid terrain layer', () => {
        const initialConfig = {
            version: 2,
            map: {
                zoom: 5,
                center: { x: 0, y: 0, crs: 'EPSG:4326' },
                layers: [
                    { id: 'layer1', type: 'osm', group: 'background', visibility: true }
                ]
            }
        };
        const state = {
            gnresource: {
                type: ResourceTypes.MAP
            },
            map: {
                present: {
                    zoom: 5,
                    center: { x: 0, y: 0, crs: 'EPSG:4326' },
                    layers: [
                        { id: 'layer1', type: 'osm', group: 'background', visibility: true },
                        { id: 'ellipsoid', type: 'terrain', provider: 'ellipsoid', group: 'background' }
                    ]
                }
            },
            layers: {
                flat: [
                    { id: 'layer1', type: 'osm', group: 'background', visibility: true },
                    { id: 'ellipsoid', type: 'terrain', provider: 'ellipsoid', group: 'background' }
                ]
            },
            mapConfigRawData: initialConfig
        };
        // Should be false because ellipsoid terrain is filtered out by compareMapChanges
        expect(isNewMapDirty(state)).toBeFalsy();
    });

    it('test isNewDashboardDirty returns true when dashboard has widgets', () => {
        const state = {
            gnresource: {
                type: ResourceTypes.DASHBOARD
            },
            widgets: {
                containers: {
                    floating: {
                        widgets: [
                            { id: 'widget1', widgetType: 'text' }
                        ]
                    }
                }
            }
        };
        expect(isNewDashboardDirty(state)).toBeTruthy();
    });

    it('test isNewDashboardDirty returns false when dashboard has no widgets and no layouts', () => {
        const state = {
            gnresource: {
                type: ResourceTypes.DASHBOARD
            },
            widgets: {
                containers: {
                    floating: {
                        widgets: []
                    }
                }
            }
        };
        expect(isNewDashboardDirty(state)).toBeFalsy();
    });

    it('test isNewDashboardDirty returns false when dashboard has default single layout and no widgets', () => {
        const state = {
            gnresource: {
                type: ResourceTypes.DASHBOARD
            },
            widgets: {
                containers: {
                    floating: {
                        widgets: [],
                        layouts: [{ id: 'layout-1', name: 'Main view', color: null }]
                    }
                }
            }
        };
        expect(isNewDashboardDirty(state)).toBeFalsy();
    });

    it('test isNewDashboardDirty returns true when dashboard has more than one layout', () => {
        const state = {
            gnresource: {
                type: ResourceTypes.DASHBOARD
            },
            widgets: {
                containers: {
                    floating: {
                        widgets: [],
                        layouts: [
                            { id: 'layout-1', name: 'Main view', color: null },
                            { id: 'layout-2', name: 'Secondary', color: null }
                        ]
                    }
                }
            }
        };
        expect(isNewDashboardDirty(state)).toBeTruthy();
    });

    it('test isNewDashboardDirty returns true when single layout differs from default (name or color)', () => {
        const stateNameChanged = {
            gnresource: {
                type: ResourceTypes.DASHBOARD
            },
            widgets: {
                containers: {
                    floating: {
                        widgets: [],
                        layouts: [{ id: 'layout-1', name: 'Custom view', color: null }]
                    }
                }
            }
        };
        expect(isNewDashboardDirty(stateNameChanged)).toBeTruthy();

        const stateColorChanged = {
            gnresource: {
                type: ResourceTypes.DASHBOARD
            },
            widgets: {
                containers: {
                    floating: {
                        widgets: [],
                        layouts: [{ id: 'layout-1', name: 'Main view', color: '#ff0000' }]
                    }
                }
            }
        };
        expect(isNewDashboardDirty(stateColorChanged)).toBeTruthy();
    });

    it('test isNewGeoStoryDirty returns false for default geostory', () => {
        const defaultConfig = {
            sections: [{ title: 'Default Title', contents: [{ html: '' }] }],
            settings: {}
        };
        const state = {
            gnresource: {
                type: ResourceTypes.GEOSTORY
            },
            geostory: {
                currentStory: {
                    ...defaultConfig,
                    defaultGeoStoryConfig: defaultConfig,
                    resources: []
                }
            }
        };
        expect(isNewGeoStoryDirty(state)).toBeFalsy();
    });

    it('test isNewGeoStoryDirty returns true when geostory has multiple sections', () => {
        const defaultConfig = {
            sections: [{ title: 'Default Title', contents: [{ html: '' }] }],
            settings: {}
        };
        const state = {
            gnresource: {
                type: ResourceTypes.GEOSTORY
            },
            geostory: {
                currentStory: {
                    sections: [
                        { title: 'Section 1', contents: [{ html: '' }] },
                        { title: 'Section 2', contents: [{ html: '' }] }
                    ],
                    defaultGeoStoryConfig: defaultConfig,
                    resources: [],
                    settings: {}
                }
            }
        };
        expect(isNewGeoStoryDirty(state)).toBeTruthy();
    });

    it('test isNewGeoStoryDirty returns true when geostory has resources', () => {
        const defaultConfig = {
            sections: [{ title: 'Default Title', contents: [{ html: '' }] }],
            settings: {}
        };
        const state = {
            gnresource: {
                type: ResourceTypes.GEOSTORY
            },
            geostory: {
                currentStory: {
                    sections: [{ title: 'Default Title', contents: [{ html: '' }] }],
                    defaultGeoStoryConfig: defaultConfig,
                    resources: [{ id: 1, type: 'map' }],
                    settings: {}
                }
            }
        };
        expect(isNewGeoStoryDirty(state)).toBeTruthy();
    });

    it('test isNewGeoStoryDirty returns true when title section has content', () => {
        const defaultConfig = {
            sections: [{ title: 'Default Title', contents: [{ html: '' }] }],
            settings: {}
        };
        const state = {
            gnresource: {
                type: ResourceTypes.GEOSTORY
            },
            geostory: {
                currentStory: {
                    sections: [{ title: 'Default Title', contents: [{ html: 'Some content here' }] }],
                    defaultGeoStoryConfig: defaultConfig,
                    resources: [],
                    settings: {}
                }
            }
        };
        expect(isNewGeoStoryDirty(state)).toBeTruthy();
    });

    it('test isNewGeoStoryDirty returns false when currentData is null', () => {
        const state = {
            gnresource: {
                type: ResourceTypes.GEOSTORY
            },
            geostory: {
                currentStory: null
            }
        };
        expect(isNewGeoStoryDirty(state)).toBeFalsy();
    });
});
