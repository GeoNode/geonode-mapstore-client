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
    getResourceByPk
} from '@js/api/geonode/user';

let mockAxios;

describe('GeoNode v1 api', () => {
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

    it('should request a resource by primary key (getResourceByPk)', (done) => {
        const pk = 1;
        const resource = {
            'id': pk,
            'title': 'Map',
            'abstract': 'Description',
            'thumbnail_url': 'thumbnail.jpeg'
        };
        mockAxios.onGet(new RegExp(`/base/${pk}`))
            .reply(() => {
                return [ 200, resource];
            });
        getResourceByPk(pk)
            .then((response) => {
                expect(response).toEqual({ ...resource, pk });
                done();
            });
    });
});
