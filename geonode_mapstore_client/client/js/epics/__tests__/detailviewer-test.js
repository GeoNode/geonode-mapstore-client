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
    gnGetLinkedResources
} from '@js/epics/detailviewer';
import {
    UPDATE_RESOURCE_PROPERTIES,
    setResource
} from '@js/actions/gnresource';

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
    it('gnGetLinkedResources', (done) => {
        const NUM_ACTIONS = 1;
        const pk = 1;
        const resource = {
            pk,
            'title': 'Map',
            'thumbnail_url': 'thumbnail.jpeg'
        };
        const testState = {
            gnresource: {data: {}}
        };
        mockAxios.onGet(new RegExp(`resources/${pk}/linked_resources`))
            .reply(() => [200, { resources: [{pk: 2, title: "Title"}] }]);

        testEpic(
            gnGetLinkedResources,
            NUM_ACTIONS,
            setResource(resource),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            UPDATE_RESOURCE_PROPERTIES
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
