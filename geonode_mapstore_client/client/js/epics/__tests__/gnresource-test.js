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
import { testEpic, addTimeoutEpic, TEST_TIMEOUT } from '@mapstore/framework/epics/__tests__/epicTestUtils';
import {
    gnViewerSetNewResourceThumbnail,
    closeInfoPanelOnMapClick,
    closeDatasetCatalogPanel,
    gnZoomToFitBounds,
    gnAddDimensionToLayer
} from '@js/epics/gnresource';
import {
    setResourceThumbnail,
    UPDATE_RESOURCE_PROPERTIES,
    UPDATE_SINGLE_RESOURCE,
    updateResource
} from '@js/actions/gnresource';
import { clickOnMap, changeMapView, ZOOM_TO_EXTENT } from '@mapstore/framework/actions/map';
import { SET_CONTROL_PROPERTY, setControlProperty } from '@mapstore/framework/actions/controls';
import {
    SHOW_NOTIFICATION
} from '@mapstore/framework/actions/notifications';
import { newMapInfoRequest } from '@mapstore/framework/actions/mapInfo';
import { UPDATE_NODE } from '@mapstore/framework/actions/layers';

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
    it('should update layer with dimension when resource is dataset other than 3dtiles', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            gnresource: {
                data: {
                    pk: 1,
                    resource_type: 'dataset',
                    subtype: "vector",
                    links: [{ link_type: 'OGC:WMTS', url: 'http://example.com/wmts' }],
                    has_time: true,
                    timeseries: {
                        "has_time": true,
                        "attribute": 150,
                        "end_attribute": 167,
                        "presentation": "DISCRETE_INTERVAL",
                        "precision_value": 50,
                        "precision_step": "seconds"
                    }
                }
            }
        };
        testEpic(gnAddDimensionToLayer,
            NUM_ACTIONS,
            [updateResource({ pk: 1, resource_type: 'dataset', subtype: "vector" })],
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_NODE);
                    expect(actions[0].nodeType).toBe("layers");
                    expect(actions[0].options).toEqual({"dimensions": [{
                        "name": "time",
                        "source": {
                            "type": "multidim-extension", "url": "http://example.com/wmts"}
                    }]});
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });
    it('should update layer with empty dimension when has_time is false', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {
            gnresource: {
                data: {
                    pk: 1,
                    resource_type: 'dataset',
                    subtype: "vector",
                    links: [{ link_type: 'OGC:WMTS', url: 'http://example.com/wmts' }],
                    has_time: false,
                    timeseries: {
                        "has_time": false
                    }
                }
            }
        };
        testEpic(gnAddDimensionToLayer,
            NUM_ACTIONS,
            [updateResource({ pk: 1, resource_type: 'dataset', subtype: "vector" })],
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_NODE);
                    expect(actions[0].options).toEqual({"dimensions": undefined});
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });
    it('should skip updating dimension when resource is not dataset ', (done) => {
        const NUM_ACTIONS = 1;
        const testState = {};
        testEpic(addTimeoutEpic(gnAddDimensionToLayer),
            NUM_ACTIONS,
            [updateResource({ pk: 1, resource_type: 'map', subtype: "vector" })],
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(TEST_TIMEOUT);
                } catch (e) {
                    done(e);
                }
                done();
            },
            testState
        );

    });
});
