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
import Legend from '../Legend';


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
        layers: {
            flat: [{
                name: 'test',
                id: '1',
                title: 'test layer',
                type: 'wms',
                url: 'https://gs-stable.geo-solutions.it/geoserver/wms'
            }]
        }
    };

    it('render Legend plugin', () => {
        const { Plugin } = getPluginForTest(Legend, testState);
        ReactDOM.render(<Plugin />, document.getElementById('container'));
        const container = document.querySelector('.gn-legend-wrapper');
        expect(container).toBeTruthy();
    });
});
