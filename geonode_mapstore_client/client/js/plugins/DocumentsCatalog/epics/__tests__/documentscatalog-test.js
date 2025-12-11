/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { testEpic } from '@mapstore/framework/epics/__tests__/epicTestUtils';
import { SET_CONTROL_PROPERTY } from '@mapstore/framework/actions/controls';
import { UPDATE_MAP_LAYOUT } from '@mapstore/framework/actions/maplayout';
import { gnUpdateDocumentsCatalogMapLayout } from '../documentscatalog';
import { LayoutSections } from '@js/utils/LayoutUtils';

describe('gnUpdateDocumentsCatalogMapLayout epic', () => {
    beforeEach(done => {
        global.__DEVTOOLS__ = true;
        setTimeout(done);
    });

    afterEach(done => {
        delete global.__DEVTOOLS__;
        setTimeout(done);
    });

    it('should update map layout when documents catalog is enabled and UPDATE_MAP_LAYOUT action is dispatched', (done) => {
        const NUM_ACTIONS = 1;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: true
                },
                drawer: {
                    enabled: false
                }
            },
            maplayout: {
                boundingMapRect: {},
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: UPDATE_MAP_LAYOUT,
            layout: {
                left: 300
            }
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_MAP_LAYOUT);
                    expect(actions[0].layout.right).toBe(658);
                    expect(actions[0].source).toBe(LayoutSections.PANEL);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });

    it('should update map layout with drawer offset when drawer is enabled', (done) => {
        const NUM_ACTIONS = 1;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: true
                },
                drawer: {
                    enabled: true
                }
            },
            maplayout: {
                boundingMapRect: {},
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: UPDATE_MAP_LAYOUT,
            layout: {}
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_MAP_LAYOUT);
                    expect(actions[0].layout.left).toBe(300);
                    expect(actions[0].layout.right).toBe(658);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });

    it('should not dispatch action when documents catalog is disabled', (done) => {
        const NUM_ACTIONS = 0;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: false
                },
                drawer: {
                    enabled: false
                }
            },
            maplayout: {
                boundingMapRect: {},
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: UPDATE_MAP_LAYOUT,
            layout: {}
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(0);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });

    it('should not dispatch action when source is PANEL', (done) => {
        const NUM_ACTIONS = 0;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: true
                },
                drawer: {
                    enabled: false
                }
            },
            maplayout: {
                boundingMapRect: {},
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: UPDATE_MAP_LAYOUT,
            layout: {},
            source: LayoutSections.PANEL
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(0);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });

    it('should handle SET_CONTROL_PROPERTY action when documents catalog is enabled', (done) => {
        const NUM_ACTIONS = 1;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: true
                },
                drawer: {
                    enabled: false
                }
            },
            maplayout: {
                boundingMapRect: {},
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: SET_CONTROL_PROPERTY,
            control: 'documentsCatalog',
            property: 'enabled',
            value: true,
            layout: {
                bottom: 30
            }
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].type).toBe(UPDATE_MAP_LAYOUT);
                    expect(actions[0].layout.right).toBe(658);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });

    it('should set source to PANEL in dispatched action', (done) => {
        const NUM_ACTIONS = 1;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: true
                },
                drawer: {
                    enabled: false
                }
            },
            maplayout: {
                boundingMapRect: {},
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: UPDATE_MAP_LAYOUT,
            layout: {},
            source: 'OTHER_SOURCE'
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    expect(actions[0].source).toBe(LayoutSections.PANEL);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });

    it('should set boundingMapRect with correct right offset', (done) => {
        const NUM_ACTIONS = 1;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: true
                },
                drawer: {
                    enabled: false
                }
            },
            maplayout: {
                boundingMapRect: {
                    left: 100
                },
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: UPDATE_MAP_LAYOUT,
            layout: {
                boundingMapRect: {
                    top: 50
                }
            }
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    const resultAction = actions[0];
                    expect(resultAction.layout.boundingMapRect.right).toBe(658);
                    expect(resultAction.layout.boundingMapRect.top).toBe(50);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });

    it('should handle both drawer and documents catalog enabled', (done) => {
        const NUM_ACTIONS = 1;
        const initialState = {
            controls: {
                documentsCatalog: {
                    enabled: true
                },
                drawer: {
                    enabled: true
                }
            },
            maplayout: {
                boundingMapRect: {},
                boundingSidebarRect: {}
            }
        };

        const action = {
            type: UPDATE_MAP_LAYOUT,
            layout: {}
        };

        testEpic(
            gnUpdateDocumentsCatalogMapLayout,
            NUM_ACTIONS,
            action,
            (actions) => {
                try {
                    expect(actions.length).toBe(1);
                    const resultAction = actions[0];
                    expect(resultAction.layout.left).toBe(300);
                    expect(resultAction.layout.right).toBe(658);
                    expect(resultAction.layout.boundingMapRect.left).toBe(300);
                    expect(resultAction.layout.boundingMapRect.right).toBe(658);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            initialState,
            done
        );
    });
});
