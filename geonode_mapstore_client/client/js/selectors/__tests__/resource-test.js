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
    getGeonodeResourceDataFromGeostory,
    getGeonodeResourceFromDashboard
} from '../resource';

const testState = {
    gnresource: {
        type: 'testResource',
        isNew: true
    },
    geostory: {
        currentStory: {
            resources: [{data: {sourceId: 'geonode'}, name: 'test'}, {name: 'test2'}]
        }
    },
    dashboard: {
        originalData: {
            widgets: [{widgetType: 'map', name: 'test widget', map: {extraParams: {pk: 1}}}, {widgetType: 'map', name: 'test widget 2', map: {pk: 1}}]
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
    it('getGeonodeResourceDataFromGeostory', () => {
        expect(getGeonodeResourceDataFromGeostory(testState)).toEqual([{ data: { sourceId: 'geonode' }, name: 'test' }]);
    });
    it('getGeonodeResourceFromDashboard', () => {
        expect(getGeonodeResourceFromDashboard(testState)).toEqual([{widgetType: 'map', name: 'test widget', map: {extraParams: {pk: 1}}}]);
    });
});
