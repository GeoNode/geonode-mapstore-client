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
    gnViewerSetNewResourceThumbnail,
    closeInfoPanelOnMapClick
} from '@js/epics/gnresource';
import {
    setResourceThumbnail,
    UPDATE_RESOURCE_PROPERTIES,
    UPDATE_SINGLE_RESOURCE
} from '@js/actions/gnresource';
import { clickOnMap } from '@mapstore/framework/actions/map';
import { SET_CONTROL_PROPERTY } from '@mapstore/framework/actions/controls';
import {
    SHOW_NOTIFICATION
} from '@mapstore/framework/actions/notifications';

let mockAxios;

describe('gnresource epics', () => {
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

    it('should apply new resource thumbnail', (done) => {
        const NUM_ACTIONS = 3;
        const pk = 1;
        const testState = {
            gnresource: {
                id: pk,
                data: {
                    'title': 'Map',
                    'thumbnail_url': 'thumbnail.jpeg'
                }
            }
        };
        mockAxios.onPut(new RegExp(`resources/${pk}/set_thumbnail`))
            .reply(() => [200, { thumbnail_url: 'test_url' }]);

        testEpic(
            gnViewerSetNewResourceThumbnail,
            NUM_ACTIONS,
            setResourceThumbnail(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            UPDATE_RESOURCE_PROPERTIES,
                            UPDATE_SINGLE_RESOURCE,
                            SHOW_NOTIFICATION
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );
    });

    it('should close share panels on map click', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            controls: {
                rightOverlay: {
                    enabled: 'Share'
                }
            }
        };

        testEpic(closeInfoPanelOnMapClick,
            NUM_ACTIONS,
            clickOnMap(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SET_CONTROL_PROPERTY
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });

    it('should close info panel on map click', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            controls: {
                rightOverlay: {
                    enabled: 'DetailViewer'
                }
            }
        };

        testEpic(closeInfoPanelOnMapClick,
            NUM_ACTIONS,
            clickOnMap(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SET_CONTROL_PROPERTY
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
