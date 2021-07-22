/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import gnresource from '@js/reducers/gnresource';
import {
    resourceLoading,
    setResource,
    resourceError,
    updateResourceProperties,
    setResourceType,
    setNewResource,
    setResourceId,
    setResourcePermissions
} from '@js/actions/gnresource';

describe('gnresource reducer', () => {
    it('should test resourceLoading', () => {
        const state = gnresource({}, resourceLoading());
        expect(state).toEqual({
            loading: true
        });
    });
    it('should test setResource', () => {
        const resource = {
            'pk': 1,
            'title': 'Title',
            'abstract': 'Description',
            'thumbnail_url': 'thumbnail.jpeg'
        };
        const state = gnresource({}, setResource(resource));
        expect(state).toEqual({
            error: null,
            isNew: false,
            data: resource,
            loading: false
        });
    });
    it('should test resourceError', () => {
        const error = {};
        const state = gnresource({}, resourceError(error));
        expect(state).toEqual({
            data: null,
            error,
            loading: false
        });
    });
    it('should test updateResourceProperties', () => {
        const properties = {
            title: 'New title'
        };
        const state = gnresource({ data: {
            'pk': 1,
            'title': 'Title',
            'abstract': 'Description',
            'thumbnail_url': 'thumbnail.jpeg'
        } }, updateResourceProperties(properties));
        expect(state).toEqual({
            data: {
                'pk': 1,
                'title': 'New title',
                'abstract': 'Description',
                'thumbnail_url': 'thumbnail.jpeg'
            }
        });
    });
    it('should test setResourceType', () => {
        const resourceType = 'map';
        const state = gnresource({}, setResourceType(resourceType));
        expect(state).toEqual({
            type: resourceType
        });
    });
    it('should test setNewResource', () => {
        const state = gnresource({}, setNewResource());
        expect(state).toEqual({
            selectedLayerPermissions: [],
            data: {},
            permissions: [],
            isNew: true
        });
    });
    it('should test setResourceId', () => {
        const id = 1;
        const state = gnresource({}, setResourceId(id));
        expect(state).toEqual({
            id
        });
    });
    it('should test setResourcePermissions', () => {
        const permissions = {
            canEdit: true,
            canView: true
        };
        const state = gnresource({}, setResourcePermissions(permissions));
        expect(state).toEqual({
            permissions
        });
    });
});
