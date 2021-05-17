/*
 * Copyright 2020, GeoSolutions Sas.
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
    SAVING_RESOURCE,
    SAVE_SUCCESS,
    SAVE_ERROR,
    saveContent,
    updateResourceBeforeSave,
    saveDirectContent
} from '@js/actions/gnsave';
import {
    UPDATE_RESOURCE_PROPERTIES,
    RESOURCE_LOADING,
    SET_RESOURCE,
    RESOURCE_ERROR
} from '@js/actions/gnresource';
import {
    gnSaveContent,
    gnUpdateResource,
    gnSaveDirectContent
} from '@js/epics/gnsave';

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
    it('should create new map with success (gnSaveContent)', (done) => {
        const NUM_ACTIONS = 3;
        const metadata = {
            title: 'Title',
            description: 'Description',
            thumbnail: 'thumbnail.jpeg'
        };
        mockAxios.onPost().reply(() => [200, {}]);
        testEpic(
            gnSaveContent,
            NUM_ACTIONS,
            saveContent(undefined, metadata, false),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SAVING_RESOURCE,
                            SAVE_SUCCESS,
                            UPDATE_RESOURCE_PROPERTIES
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            {}
        );
    });
    it('should update existing map with success (gnSaveContent)', (done) => {
        const NUM_ACTIONS = 3;
        const id = 1;
        const metadata = {
            title: 'Title',
            description: 'Description',
            thumbnail: 'thumbnail.jpeg'
        };
        mockAxios.onPatch().reply(() => [200, {}]);
        testEpic(
            gnSaveContent,
            NUM_ACTIONS,
            saveContent(id, metadata, false, false),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SAVING_RESOURCE,
                            SAVE_SUCCESS,
                            UPDATE_RESOURCE_PROPERTIES
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            {}
        );
    });
    it('should save content with error (updateResourceBeforeSave)', (done) => {
        const NUM_ACTIONS = 2;
        const metadata = {
            title: 'Title',
            description: 'Description',
            thumbnail: 'thumbnail.jpeg'
        };
        testEpic(
            gnSaveContent,
            NUM_ACTIONS,
            saveContent(undefined, metadata),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SAVING_RESOURCE,
                            SAVE_ERROR
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            {}
        );
    });
    it('should update resource before save (gnUpdateResource)', (done) => {
        const NUM_ACTIONS = 2;
        const id = 1;
        mockAxios.onGet().reply(() => [200, {}]);
        testEpic(
            gnUpdateResource,
            NUM_ACTIONS,
            updateResourceBeforeSave(id),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            RESOURCE_LOADING,
                            SET_RESOURCE
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            {}
        );
    });
    it('should update resource before save with error (gnUpdateResource)', (done) => {
        const NUM_ACTIONS = 2;
        const id = 1;
        testEpic(
            gnUpdateResource,
            NUM_ACTIONS,
            updateResourceBeforeSave(id),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            RESOURCE_LOADING,
                            RESOURCE_ERROR
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            {}
        );
    });

    it('should trigger saveResource (gnSaveDirectContent)', (done) => {
        const NUM_ACTIONS = 2;
        const pk = 1
        const resource = {
            'id': pk,
            'title': 'Map',
            'abstract': 'Description',
            'thumbnail_url': 'thumbnail.jpeg'
        };
        mockAxios.onGet(new RegExp(`resources/${pk}`))
        .reply(200, resource);
        testEpic(
            gnSaveDirectContent,
            NUM_ACTIONS,
            saveDirectContent(),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([SAVING_RESOURCE, SET_RESOURCE]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            {map: {info: {id: pk}}}
        );
    });
});
