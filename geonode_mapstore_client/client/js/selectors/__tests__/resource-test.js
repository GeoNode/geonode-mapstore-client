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
    canEditPermissions
} from '../resource';

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
});
