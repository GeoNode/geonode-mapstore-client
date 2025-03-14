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
    getGeoNodeResourceDataFromGeoStory,
    getGeoNodeResourceFromDashboard,
    getResourceThumbnail,
    updatingThumbnailResource,
    isThumbnailChanged,
    canEditPermissions,
    canManageResourcePermissions,
    isNewMapViewerResource,
    defaultViewerPluginsSelector,
    getLayerSettingsDirtyState
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
    it('test isNewMapViewerResource', () => {
        let state = {...testState, gnresource: {...testState.gnresource, type: ResourceTypes.VIEWER, params: {pk: "new"}}};
        expect(isNewMapViewerResource(state)).toBeTruthy();
        state.gnresource.params.pk = '1';
        expect(isNewMapViewerResource(state)).toBeFalsy();
    });
    it('test defaultViewerPluginsSelector', () => {
        let state = {...testState};
        state.gnresource = {...state.gnresource, defaultViewerPlugins: ["TOC"]};
        expect(defaultViewerPluginsSelector(state)).toEqual(["TOC"]);
        state.gnresource = {...state.gnresource, defaultViewerPlugins: undefined};
        expect(defaultViewerPluginsSelector(state)).toEqual([]);
    });
    describe('getLayerSettingsDirtyState', () => {
        const state = {
            gnresource: {
                data: {
                    layerSettings: {
                        opacity: 0.8,
                        style: "test:style"
                    }
                }
            },
            layers: {
                selected: ['layer001'],
                flat: [{
                    id: 'layer001',
                    name: 'layer001',
                    settings: {
                        opacity: 0.7
                    }
                }],
                settings: {
                    options: {
                        opacity: 0.7
                    }
                }
            }
        };
        it('should return true when setting is changes', () => {
            expect(getLayerSettingsDirtyState(state)).toBe(true);
        });
        it('should return false when setting is unchanged', () => {
            const _state = {
                ...state,
                layers: {
                    selected: ['layer001'],
                    flat: [{
                        id: 'layer001',
                        name: 'layer001',
                        settings: {
                            opacity: 0.8
                        }
                    }],
                    settings: {
                        options: {
                            opacity: 0.8
                        }
                    }
                }
            };
            expect(getLayerSettingsDirtyState(_state)).toBe(false);
        });
        it('should return true when field is changed', () => {
            const _state = {
                ...state,
                gnresource: {
                    data: {
                        layerSettings: {
                            opacity: 0.8,
                            style: "test:style",
                            fields: [{id: 1, label: "test1", value: "test"}]
                        }
                    }
                },
                layers: {
                    ...state.layers,
                    flat: [{
                        ...state.layers.flat[0],
                        fields: [{id: 1, label: "test", value: "test"}]
                    }]
                }
            };
            expect(getLayerSettingsDirtyState(_state)).toBe(true);
        });
        it('should return false when field is unchanged', () => {
            const _state = {
                gnresource: {
                    data: {
                        layerSettings: {
                            opacity: 0.8,
                            fields: [{id: 1, label: "test", value: "test"}]
                        }
                    }
                },
                layers: {
                    ...state.layers,
                    flat: [{
                        ...state.layers.flat[0],
                        fields: [{id: 1, label: "test", value: "test"}]
                    }],
                    settings: {
                        options: {
                            opacity: 0.8
                        }
                    }
                }
            };
            expect(getLayerSettingsDirtyState(_state)).toBe(false);
        });
    });
});
