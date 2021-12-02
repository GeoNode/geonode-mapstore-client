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
import GeneralSettings from '../GeneralSettings';

describe('GeneralSettings', () => {
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
        ReactDOM.render(<GeneralSettings />, document.getElementById('container'));
        const containerChildren = document.querySelectorAll('#container > *');
        expect(containerChildren.length).toBe(4);
    });

    it('should read title as string', () => {
        ReactDOM.render(<GeneralSettings node={{ title: 'Title' }}/>, document.getElementById('container'));
        const inputs = document.querySelectorAll('input');
        expect(inputs.length).toBe(4);
        const titleInput = inputs[0];
        expect(titleInput.value).toBe('Title');
    });

    it('should read title as object', () => {
        ReactDOM.render(<GeneralSettings node={{ title: { 'default': 'Title', 'en-US': 'En Title'} }} currentLocale="en-US"/>, document.getElementById('container'));
        const inputs = document.querySelectorAll('input');
        expect(inputs.length).toBe(4);
        const titleInput = inputs[0];
        expect(titleInput.value).toBe('En Title');
    });
    it('should use the on change callback', (done) => {
        ReactDOM.render(<GeneralSettings
            node={{ title: 'Title' }}
            onChange={({ title }) => {
                try {
                    expect(title).toBe('New Title');
                } catch (e) {
                    done(e);
                }
                done();
            }}
        />, document.getElementById('container'));
        const inputs = document.querySelectorAll('input');
        expect(inputs.length).toBe(4);
        const titleInput = inputs[0];
        expect(titleInput.value).toBe('Title');
        Simulate.blur(titleInput, { target: { value: 'New Title' }});
    });
});
