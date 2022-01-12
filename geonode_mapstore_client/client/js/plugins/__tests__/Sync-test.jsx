/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { getPluginForTest } from '@mapstore/framework/plugins/__tests__/pluginsTestUtils';
import Sync from '../Sync';


describe('Sync Plugin', () => {
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
        security: {
            user: {
                perms: ["add_resource"],
                is_superuser: true,
                pk: 1,
                username: "testUser"
            }
        }
    };

    it('render Sync plugin', () => {
        const { Plugin } = getPluginForTest(Sync, testState);
        ReactDOM.render(<Plugin />, document.getElementById('container'));
        const syncButton = document.querySelector('button');
        expect(syncButton).toBeTruthy();
    });
});
