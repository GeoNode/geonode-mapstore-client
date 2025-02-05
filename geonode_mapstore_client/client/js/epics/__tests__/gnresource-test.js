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
    closeInfoPanelOnMapClick,
    closeDatasetCatalogPanel,
    gnZoomToFitBounds
} from '@js/epics/gnresource';
import {
    setResourceThumbnail,
    UPDATE_RESOURCE_PROPERTIES,
    UPDATE_SINGLE_RESOURCE
} from '@js/actions/gnresource';
import { clickOnMap, changeMapView, ZOOM_TO_EXTENT } from '@mapstore/framework/actions/map';
import { SET_CONTROL_PROPERTY, setControlProperty } from '@mapstore/framework/actions/controls';
import {
    SHOW_NOTIFICATION
} from '@mapstore/framework/actions/notifications';
import { newMapInfoRequest } from '@mapstore/framework/actions/mapInfo';

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
    it('close dataset panels on map info panel open', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            context: {
                currentContext: {
                    plugins: {
                        desktop: [
                            {name: "Identify"}
                        ]
                    }
                }
            },
            mapInfo: {
                requests: ["something"]
            },
            controls: {
                datasetsCatalog: {
                    enabled: true
                }
            }
        };

        testEpic(closeDatasetCatalogPanel,
            NUM_ACTIONS,
            newMapInfoRequest(),
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(SET_CONTROL_PROPERTY);
                    expect(actions[0].control).toBe("datasetsCatalog");
                    expect(actions[0].value).toBe(false);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });

    it('should zoom to extent with the fitBounds control', (done) => {
        const NUM_ACTIONS = 2;
        const testState = {};
        testEpic(gnZoomToFitBounds,
            NUM_ACTIONS,
            [setControlProperty('fitBounds', 'geometry', [-180, -90, 180, 90]), changeMapView()],
            (actions) => {
                try {
                    expect(actions.length).toBe(2);
                    expect(actions[0].type).toBe(ZOOM_TO_EXTENT);
                    expect(actions[1].type).toBe(SET_CONTROL_PROPERTY);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });
});
