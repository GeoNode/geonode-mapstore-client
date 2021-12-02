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
import { Simulate } from 'react-dom/test-utils';
import SettingsSection from '../SettingsSection';

describe('SettingsSection', () => {
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
        ReactDOM.render(<SettingsSection><div className="child"></div></SettingsSection>, document.getElementById('container'));
        const title = document.querySelector('.gn-layer-settings-section-title');
        expect(title).toBeTruthy();
        const child = document.querySelector('.child');
        expect(child).toBeFalsy();
    });
    it('should show children after clicking on title', () => {
        ReactDOM.render(<SettingsSection><div className="child"></div></SettingsSection>, document.getElementById('container'));
        const title = document.querySelector('.gn-layer-settings-section-title');
        expect(title).toBeTruthy();
        let child = document.querySelector('.child');
        expect(child).toBeFalsy();
        Simulate.click(title);
        child = document.querySelector('.child');
        expect(child).toBeTruthy();
    });
});
