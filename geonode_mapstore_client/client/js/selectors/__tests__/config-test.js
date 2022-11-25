/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { setConfigProp } from "@mapstore/framework/utils/ConfigUtils";
import {
    getCustomMenuFilters
} from '../config';

describe('config selector', () => {
    afterEach((done) => {
        setConfigProp('monitorState', undefined);
        setConfigProp('geoNodeConfiguration', undefined);
        setTimeout(done);
    });
    it('getCustomMenuFilters', () => {
        setConfigProp('monitorState', [
            {
                "name": "user",
                "path": "security.user"
            }
        ]);
        setConfigProp('geoNodeCustomFilters', {
            'pending-approval': {
                "filter{is_approved}": false
            },
            'approved-resources': {
                "filter{is_approved}": true
            }
        });

        const state = {
            security: {
                user: { pk: 1 }
            }
        };
        const menuFilters = getCustomMenuFilters(state);
        expect(menuFilters).toEqual([
            {
                id: 'pending-approval',
                query: { 'filter{is_approved}': false }
            },
            {
                id: 'approved-resources',
                query: { 'filter{is_approved}': true }
            }
        ]);
    });
});
