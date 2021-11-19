/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    getViewedResourceType
} from '../resource';

const testState = {
    gnresource: {
        type: 'testResource'
    }
};

describe('resource selector', () => {
    it('resource type', () => {
        expect(getViewedResourceType(testState)).toBe('testResource');
    });
});
