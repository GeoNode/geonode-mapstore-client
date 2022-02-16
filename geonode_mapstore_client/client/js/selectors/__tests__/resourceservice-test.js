/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getCurrentProcesses } from '../resourceservice';

const testState = {
    resourceservice: {
        processes: [{ name: 'test process' }]
    }
};

describe('resourceservice selector', () => {

    it('test getCurrentProcesses', () => {
        expect(getCurrentProcesses(testState)).toEqual([{ name: 'test process' }]);
    });

});
