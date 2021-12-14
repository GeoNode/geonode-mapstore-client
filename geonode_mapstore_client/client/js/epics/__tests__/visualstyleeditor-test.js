/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { testEpic } from '@mapstore/framework/epics/__tests__/epicTestUtils';
import { updateStyleCode } from '@mapstore/framework/actions/styleeditor';
import { gnUpdateStyleInfoOnSave } from '@js/epics/visualstyleeditor';

import { UPDATE_NODE } from '@mapstore/framework/actions/layers';

describe('visualstyleeditor epics', () => {
    beforeEach(done => {
        setTimeout(done);
    });
    afterEach(done => {
        setTimeout(done);
    });
    it('should update style information on save', (done) => {
        const NUM_ACTIONS = 1;

        testEpic(
            gnUpdateStyleInfoOnSave,
            NUM_ACTIONS,
            updateStyleCode(),
            (actions) => {
                try {
                    expect(actions.map(({type}) => type)).toEqual([ UPDATE_NODE ]);
                    done();
                } catch (e) {
                    done(e);
                }
            },
            {},
            done
        );
    });

});
