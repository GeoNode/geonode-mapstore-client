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
import trim from 'lodash/trim';
import BaseLayerSettings from '../BaseLayerSettings';

describe('BaseLayerSettings', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render with default', () => {
        ReactDOM.render(<BaseLayerSettings/>, document.getElementById('container'));
        const sections = document.querySelectorAll('.gn-layer-settings-section-title');
        expect(sections.length).toBe(2);
        expect([...sections].map(section => trim(section.innerText))).toEqual([
            'gnviewer.generalSettings',
            'gnviewer.visibilitySettings'
        ]);
    });
});
