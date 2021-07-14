/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import FiltersForm from '../FiltersForm';
import { Simulate } from 'react-dom/test-utils';

describe('FiltersForm component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('should render with default', () => {
        ReactDOM.render( <FiltersForm />, document.getElementById("container"));
        const filterFormNode = document.querySelector('.gn-filter-form');
        expect(filterFormNode).toBeTruthy();
    });
    it('should trigger on change after clicking on apply', (done) => {
        const onChange = (values) => {
            try {
                expect(values).toBeTruthy();
                done();
            } catch (e) {
                done(e);
            }
        };
        ReactDOM.render( <FiltersForm show onChange={onChange} submitOnChangeField={false} />, document.getElementById("container"));
        const filterFormNode = document.querySelector('.gn-filter-form');
        expect(filterFormNode).toBeTruthy();
        const footerButtons = filterFormNode.querySelectorAll('.gn-filter-form-footer > button');
        expect(footerButtons.length).toBe(2);
        const applyButton = footerButtons[0];
        Simulate.click(applyButton);
    });
    it('should trigger on clear', (done) => {
        const onClear = (values) => {
            try {
                expect(values).toBeTruthy();
                done();
            } catch (e) {
                done(e);
            }
        };
        ReactDOM.render( <FiltersForm show onClear={onClear} query={{ q: 'A' }} submitOnChangeField={false} />, document.getElementById("container"));
        const filterFormNode = document.querySelector('.gn-filter-form');
        expect(filterFormNode).toBeTruthy();
        const footerButtons = filterFormNode.querySelectorAll('.gn-filter-form-footer > button');
        expect(footerButtons.length).toBe(2);
        const clearButton = footerButtons[1];
        Simulate.click(clearButton);
    });
    it('should trigger on close after clicking on times icon', (done) => {
        const onClose = () => {
            try {
                done();
            } catch (e) {
                done(e);
            }
        };
        ReactDOM.render( <FiltersForm show onClose={onClose} />, document.getElementById("container"));
        const filterFormNode = document.querySelector('.gn-filter-form');
        expect(filterFormNode).toBeTruthy();
        const footerButtons = filterFormNode.querySelectorAll('.gn-filter-form-header > button');
        expect(footerButtons.length).toBe(1);
        const closeButton = footerButtons[0];
        Simulate.click(closeButton);
    });

    it('should the apply button hidden with submitOnChangeField flag', () => {
        ReactDOM.render( <FiltersForm show  submitOnChangeField />, document.getElementById("container"));
        const filterFormNode = document.querySelector('.gn-filter-form');
        expect(filterFormNode).toBeTruthy();
        const footerButtons = filterFormNode.querySelectorAll('.gn-filter-form-footer > button');
        expect(footerButtons.length).toBe(1);

    });

});
