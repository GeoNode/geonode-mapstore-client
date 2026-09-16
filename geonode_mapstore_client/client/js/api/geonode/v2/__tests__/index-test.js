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
import {
    createMap,
    updateMap,
    getAssetsByPk
} from '@js/api/geonode/v2';

let mockAxios;

describe('GeoNode v2 api', () => {
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
    it('should post new configuration to mapstore rest (createMap)', (done) => {
        const mapConfiguration = {
            id: 1,
            attributes: [],
            data: {},
            name: 'Map'
        };
        mockAxios.onPost(/\/api\/v2\/maps/)
            .reply((config) => {
                try {
                    expect(config.data).toBe(JSON.stringify(mapConfiguration));
                } catch (e) {
                    done(e);
                }
                done();
                return [ 200, { }];
            });

        createMap(mapConfiguration);
    });
    it('should patch configuration to mapstore rest (updateMap)', (done) => {
        const id = 1;
        const mapConfiguration = {
            id: 1,
            attributes: [],
            data: {},
            name: 'Map'
        };
        mockAxios.onPatch(new RegExp(`/api/v2/maps/${id}`))
            .reply((config) => {
                try {
                    expect(config.data).toBe(JSON.stringify(mapConfiguration));
                } catch (e) {
                    done(e);
                }
                done();
                return [ 200, { }];
            });

        updateMap(id, mapConfiguration);
    });
    it('should get assets from resource pk, unwrapping a bare array (getAssetsByPk)', (done) => {
        const pk = 1;
        const assets = [{
            id: 1,
            title: 'points.png',
            description: '',
            type: 'png',
            created: '2026-08-27T17:06:28.407146Z',
            deletable: true,
            urls: {
                download_url: '/api/v2/assets/1/download',
                link: '/api/v2/assets/1/link'
            }
        }];
        mockAxios.onGet(new RegExp(`/api/v2/resources/${pk}/asset`))
            .reply(200, assets);

        getAssetsByPk(pk).then((response) => {
            try {
                expect(response).toEqual(assets);
            } catch (e) {
                done(e);
                return;
            }
            done();
        });
    });
    it('should get assets from resource pk, unwrapping an envelope with an assets key (getAssetsByPk)', (done) => {
        const pk = 1;
        const assets = [{
            id: 1,
            title: 'points.png',
            created: '2026-08-27T17:06:28.407146Z',
            deletable: true,
            urls: {
                download_url: '/api/v2/assets/1/download',
                link: '/api/v2/assets/1/link'
            }
        }];
        mockAxios.onGet(new RegExp(`/api/v2/resources/${pk}/asset`))
            .reply(200, { assets });

        getAssetsByPk(pk).then((response) => {
            try {
                expect(response).toEqual(assets);
            } catch (e) {
                done(e);
                return;
            }
            done();
        });
    });
});
