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
    saveDirectContent,
    SAVE_CONTENT
} from '@js/actions/gnsave';
import { SET_CONTROL_PROPERTY } from '@mapstore/framework/actions/controls';
import {
    RESET_GEO_LIMITS,
    RESOURCE_LOADING,
    SET_RESOURCE,
    RESOURCE_ERROR,
    SET_SELECTED_DATASET_PERMISSIONS
} from '@js/actions/gnresource';
import {
    gnSaveContent,
    gnUpdateResource,
    gnSaveDirectContent
} from '@js/epics/gnsave';
import {gnCheckSelectedDatasetPermissions, gnSetDatasetsPermissions} from '@js/epics';
import { SET_PERMISSION } from '@mapstore/framework/actions/featuregrid';
import { SET_EDIT_PERMISSION } from '@mapstore/framework/actions/styleeditor';
import { configureMap } from '@mapstore/framework/actions/config';

import { selectNode, addLayer } from '@mapstore/framework/actions/layers';


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
        const NUM_ACTIONS = 4;
        const metadata = {
            title: 'Title',
            description: 'Description',
            thumbnail: 'thumbnail.jpeg'
        };
        mockAxios.onPost().reply(() => [200, { map: {} }]);
        testEpic(
            gnSaveContent,
            NUM_ACTIONS,
            saveContent(undefined, metadata, false),
            (actions) => {
                try {
                    expect(actions.map(({ type }) => type))
                        .toEqual([
                            SAVING_RESOURCE,
                            SET_CONTROL_PROPERTY,
                            SAVE_SUCCESS,
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
    it('should update existing map with success (gnSaveContent)', (done) => {
        const NUM_ACTIONS = 4;
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
                            SET_CONTROL_PROPERTY,
                            SAVE_SUCCESS,
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

    it("gnCheckSelectedDatasetPermissions should trigger permission actions for style and edit", (done) => {

        const NUM_ACTIONS = 3;
        testEpic(gnCheckSelectedDatasetPermissions,
            NUM_ACTIONS, selectNode(1, "layer"), (actions) => {
                try {
                    expect(actions.map(({type}) => type)).toEqual([SET_PERMISSION, SET_EDIT_PERMISSION, SET_SELECTED_DATASET_PERMISSIONS]);
                    done();
                } catch (error) {
                    done(error);
                }
            }, {layers: {flat: [{name: "testLayer", id: "test_id", perms: ['download_resourcebase']}], selected: ["test_id"]}});

    });

    it('test gnSetDatasetsPermissions trigger updateNode for MAP_CONFIG_LOADED', (done) => {
        mockAxios.onGet().reply(() => [200,
            {datasets: [{perms: ['change_dataset_style', 'change_dataset_data'], alternate: "testLayer"}]}]);
        const NUM_ACTIONS = 1;
        testEpic(gnSetDatasetsPermissions, NUM_ACTIONS, configureMap({map: {layers: [{name: "testLayer", id: "test_id"}]}}), (actions) => {
            try {
                expect(actions.map(({type}) => type)).toEqual(["UPDATE_NODE"]);
                done();
            } catch (error) {
                done(error);
            }
        },
        {layers: {flat: [{name: "testLayer", id: "test_id", perms: ['download_resourcebase']}], selected: ["test_id"]}});
    });

    it('test gnSetDatasetsPermissions trigger updateNode for ADD_LAYER', (done) => {
        mockAxios.onGet().reply(() => [200,
            {datasets: [{perms: ['change_dataset_style', 'change_dataset_data'], alternate: "testLayer"}]}]);
        const NUM_ACTIONS = 1;
        testEpic(gnSetDatasetsPermissions, NUM_ACTIONS, addLayer({name: "testLayer"}), (actions) => {
            try {
                expect(actions.map(({type}) => type)).toEqual(["UPDATE_NODE"]);
                done();
            } catch (error) {
                done(error);
            }
        },
        {layers: {flat: [{name: "testLayer", id: "test_id", perms: ['download_resourcebase']}], selected: ["test_id"]}});
    });

    it('should trigger saveResource (gnSaveDirectContent)', (done) => {
        const NUM_ACTIONS = 3;
        const pk = 1;
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
                        .toEqual([
                            SAVING_RESOURCE,
                            SAVE_CONTENT,
                            RESET_GEO_LIMITS
                        ]);
                } catch (e) {
                    done(e);
                }
                done();
            },
            {map: {info: {id: pk}}}
        );
    });
});
