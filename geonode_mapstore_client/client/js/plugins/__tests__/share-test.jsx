/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { getPluginForTest } from '@mapstore/framework/plugins/__tests__/pluginsTestUtils';
import Share from '../Share';
import gnresource from '../../reducers/gnresource';


describe('Share Plugin', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        window.__DEVTOOLS__ = true;
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        window.__DEVTOOLS__ = undefined;
        setTimeout(done);
    });

    const testState = {
        gnresource: {
            type: "testType"
        },
        controls: {
            rightOverlay: {
                enabled: 'Share'
            }
        }
    };

    it('render Share plugin', () => {
        const {Plugin, store} = getPluginForTest(Share, testState, null, [], { gnresource });
        ReactDOM.render(<Plugin />, document.getElementById('container'));
        const container = document.querySelector('.gn-share-panel');
        expect(container).toBeTruthy();
        const state = store.getState().gnresource;
        expect(state.type).toBe('testType');
    });
});
