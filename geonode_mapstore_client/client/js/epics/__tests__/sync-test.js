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
import { gnSyncComponentsWithResources } from '../gnsync';
import { syncResources } from '@js/actions/gnsync';
import {
    SAVE_SUCCESS, SAVING_RESOURCE
} from '@js/actions/gnsave';
import { EDIT_RESOURCE } from '@mapstore/framework/actions/geostory';
import { DASHBOARD_LOADED } from '@mapstore/framework/actions/dashboard';
import {
    SHOW_NOTIFICATION
} from '@mapstore/framework/actions/notifications';

let mockAxios;

describe('gnsave epics', () => {
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

    it('should sync resources for geostory', (done) => {
        const pk = 1;

        const state = {
            geostory: {currentStory: {resources: [{data: {id: pk, sourceId: 'geonode', title: 'test'}, type: 'video', id: pk}]}},
            gnresource: {type: 'geostory'}
        };
        const NUM_ACTIONS = 4;
        mockAxios.onGet().reply(200, {
            documents: [
                {
                    pk,
                    title: 'Test title',
                    thumbnail: 'Test',
                    src: 'Test src',
                    description: 'A test',
                    credits: null,
                    resource_type: 'video'
                }
            ]
        });
        testEpic(
            gnSyncComponentsWithResources,
            NUM_ACTIONS,
            syncResources(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SAVING_RESOURCE, EDIT_RESOURCE, SAVE_SUCCESS, SHOW_NOTIFICATION
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            state
        );
    });
    it('should sync resources for dashboard', (done) => {
        const pk = 1;

        const state = {
            dashboard: {
                originalData: {
                    widgets: [
                        {
                            id: 'b8fe78a0-fadb-11ed-8d62-774d377a0552',
                            maps: [
                                {
                                    extraParams: {
                                        pk
                                    }
                                }
                            ],
                            widgetType: 'map'
                        }
                    ]
                }
            },
            gnresource: {type: 'dashboard'}
        };
        const NUM_ACTIONS = 4;
        mockAxios.onGet().reply(200, {
            maps: [
                {
                    pk,
                    title: 'Test title',
                    data: {
                        map: {}
                    }
                }
            ]
        });
        testEpic(
            gnSyncComponentsWithResources,
            NUM_ACTIONS,
            syncResources(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SAVING_RESOURCE, DASHBOARD_LOADED, SAVE_SUCCESS, SHOW_NOTIFICATION
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            state
        );
    });
});
