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
import GroupSettings from '../GroupSettings';

describe('GroupSettings', () => {
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
        ReactDOM.render(<GroupSettings/>, document.getElementById('container'));
        const sections = document.querySelectorAll('.gn-layer-settings-section-title');
        expect(sections.length).toBe(1);
        expect([...sections].map(section => section.innerText)).toEqual([ ' gnviewer.generalSettings' ]);
    });
});
