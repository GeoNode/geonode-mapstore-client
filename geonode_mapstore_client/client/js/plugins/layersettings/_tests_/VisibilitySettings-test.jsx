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
import VisibilitySettings from '../VisibilitySettings';

describe('VisibilitySettings', () => {
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
        ReactDOM.render(<VisibilitySettings />, document.getElementById('container'));
        const containerChildren = document.querySelectorAll('#container > *');
        expect(containerChildren.length).toBe(2);
    });

    it('should set the opacity in percentage', (done) => {
        ReactDOM.render(<VisibilitySettings
            node={{ opacity: 0.5 }}
            onChange={({ opacity }) => {
                expect(opacity).toBe(0.4);
                done();
            }}
        />, document.getElementById('container'));
        const inputs = document.querySelectorAll('input');
        expect(inputs.length).toBe(5);
        const opacityInput = inputs[0];
        expect(opacityInput.value).toBe('50');
        Simulate.change(opacityInput, { target: { value: 40 }});
    });
});
