/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import expect from 'expect';
import resourceservice from '@js/reducers/resourceservice';
import { downloadResource, downloadComplete } from '@js/actions/gnresource';

describe('resourceservice reducer', () => {
    it('DOWNLOAD_RESOURCE adds the resource to downloads', () => {
        const state = resourceservice({ processes: [], downloads: [] }, downloadResource({ pk: 1 }));
        expect(state.downloads).toEqual([{ pk: 1 }]);
    });
    it('DOWNLOAD_COMPLETE removes only the completed download, keeping the others', () => {
        const state = { processes: [], downloads: [{ pk: 1 }, { pk: 2 }] };
        expect(resourceservice(state, downloadComplete({ pk: 1 }))).toEqual({
            processes: [],
            downloads: [{ pk: 2 }]
        });
    });
});
