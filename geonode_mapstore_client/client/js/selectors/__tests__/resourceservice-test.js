/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getCurrentProcesses, processingDownload } from '../resourceservice';
import { ResourceTypes } from '@js/utils/ResourceUtils';


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
                downloads: [{  pk: 1 }]
            }
        };
        expect(processingDownload(testState)).toEqual(true);
    });
    it('test processingDownload when downloding dataset in the maplayers', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1,
                    resource_type: ResourceTypes.MAP,
                    maplayers: [{dataset: {pk: 2}}]
                }
            },
            resourceservice: {
                downloads: [{  pk: 2 }]
            }
        };
        expect(processingDownload(testState)).toEqual(true);
    });
});
