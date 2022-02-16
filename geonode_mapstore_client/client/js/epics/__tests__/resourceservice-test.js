/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import { testEpic } from '@mapstore/framework/epics/__tests__/epicTestUtils';
import {
    STOP_ASYNC_PROCESS,
    startAsyncProcess
} from '@js/actions/resourceservice';
import { gnMonitorAsyncProcesses } from '../resourceservice';

let mockAxios;

describe('resourceservice epics', () => {
    beforeEach(done => {
        global.__DEVTOOLS__ = true;
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });
    afterEach(done => {
        delete global.__DEVTOOLS__;
        mockAxios.restore();
        setTimeout(done);
    });

    it('test gnMonitorAsyncProcesses', (done) => {
        const testState = {
            resourceservice: {}
        };
        const actionsCount = 1;
        mockAxios.onGet().reply(() => [200, { status: 'finished' }]);
        testEpic(
            gnMonitorAsyncProcesses,
            actionsCount,
            startAsyncProcess({ output: {status_url: 'test'}, resource: { pk: 1, name: 'test resource' }, processType: 'test process' }),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            STOP_ASYNC_PROCESS
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );
    });
});
