/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getLocation } from '../routes';

const testState = {
    router: {
        location: {
            pathname: '/test/location'
        }
    }
};

describe('routes selector', () => {
    it('get location', () => {
        expect(getLocation(testState)).toBe('/test/location');
    });
});
