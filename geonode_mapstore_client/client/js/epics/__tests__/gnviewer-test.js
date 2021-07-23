import expect from 'expect';
import { gnViewerRequestNewGeoStoryConfig, gnViewerRequestNewMapConfig } from '@js/epics/gnviewer';
import { requestNewGeoStoryConfig, requestNewMapConfig  } from '@js/actions/gnviewer';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';

import { testEpic } from '@mapstore/framework/epics/__tests__/epicTestUtils';


let mockAxios;

export const newGeostoryConfig = {
    "type": "cascade",
    "resources": [],
    "settings": {
        "theme": {
            "general": {
                "color": "#333333",
                "backgroundColor": "#ffffff",
                "borderColor": "#e6e6e6"
            },
            "overlay": {
                "backgroundColor": "rgba(255, 255, 255, 0.75)",
                "borderColor": "#dddddd",
                "boxShadow": "0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)",
                "color": "#333333"
            }
        }
    },
    "sections": [
        {
            "type": "title",
            "id": "section_id",
            "title": "Abstract",
            "cover": true,
            "contents": [
                {
                    "id": "content_id",
                    "type": "text",
                    "size": "large",
                    "align": "center",
                    "theme": "",
                    "html": "",
                    "background": {
                        "fit": "cover",
                        "size": "full",
                        "align": "center"
                    }
                }
            ]
        }
    ]
};

describe("gnviewer epics", () => {
    beforeEach(done => {
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });
    afterEach(done => {
        delete global.__DEVTOOLS__;
        mockAxios.restore();
        setTimeout(done);
    });
    it("should call notifications incase user does not have permission", (done) => {
        mockAxios.onGet().reply(() => [200, {}]);
        const NUM_ACTIONS = 2;
        testEpic(
            gnViewerRequestNewGeoStoryConfig,
            NUM_ACTIONS,
            requestNewGeoStoryConfig(),
            (actions) => {
                try {
                    expect(actions.map(({type}) => type )).toEqual(["GEOSTORY:SET_RESOURCE", "SHOW_NOTIFICATION"]);
                    done();
                } catch (error) {
                    done(error);
                }
            },
            {});

    });

    it("should call setNewResource, setResource, setResourceType, setGeoStoryResource when user has permissions", (done) => {
        mockAxios.onGet().reply(() => [200, newGeostoryConfig]);
        const NUM_ACTIONS = 5;
        testEpic(
            gnViewerRequestNewGeoStoryConfig,
            NUM_ACTIONS,
            requestNewGeoStoryConfig(),
            (actions) => {
                try {
                    expect(actions.map(({type}) => type )).toEqual(["GEONODE:SET_NEW_RESOURCE", "GEOSTORY:SET_CURRENT_STORY", "GEONODE:SET_RESOURCE_TYPE",
                        "GEOSTORY:CHANGE_MODE", "GEOSTORY:SET_RESOURCE"]);
                    done();
                } catch (error) {
                    done(error);
                }
            },
            {security: {user: {perms: ["add_resource"]}}});

    });

    it("should call mapConfig", (done) => {
        mockAxios.onGet().reply(() => [200, {}]);
        const NUM_ACTIONS = 3;
        testEpic(
            gnViewerRequestNewMapConfig,
            NUM_ACTIONS,
            requestNewMapConfig(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type)).toEqual([
                        "GEONODE:SET_NEW_RESOURCE",
                        "MAP_CONFIG_LOADED",
                        "GEONODE:SET_RESOURCE_TYPE"
                    ]);
                    done();
                } catch (error) {
                    done(error);
                }
            },
            { security: { user: { perms: ["add_resource"] } } });

    });
});
