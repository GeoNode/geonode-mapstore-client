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
    getResourceThumbnail,
    updatingThumbnailResource,
    isThumbnailChanged
} from '../resource';

const testState = {
    gnresource: {
        type: 'testResource',
        isNew: true,
        data: {
            thumbnailChanged: true,
            thumbnail_url: 'thumbnail.jpeg',
            updatingThumbnail: true
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

    it('should get thumbnail change status', () => {
        expect(isThumbnailChanged(testState)).toBeTruthy();
    });

    it('should get resource thumbnail', () => {
        expect(getResourceThumbnail(testState)).toBe('thumbnail.jpeg');
    });

    it('should get resource thumbnail updating status', () => {
        expect(updatingThumbnailResource(testState)).toBeTruthy();
    });
});
