/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getCurrentProcesses, processingDownload } from '../resourceservice';


describe('resourceservice selector', () => {

    it('test getCurrentProcesses', () => {
        const testState = {
            resourceservice: {
                processes: [{ name: 'test process' }]
            }
        };
        expect(getCurrentProcesses(testState)).toEqual([{ name: 'test process' }]);
    });

    it('test processingDownload', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1
                }
            },
            resourceservice: {
                processes: [{ resource: { pk: 1 }, processType: 'downloadResource' }]
            }
        };
        expect(processingDownload(testState)).toEqual(true);
    });

});
