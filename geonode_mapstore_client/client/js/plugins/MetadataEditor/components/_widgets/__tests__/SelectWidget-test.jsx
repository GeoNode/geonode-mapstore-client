/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';
import expect from 'expect';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import SelectWidget from '../SelectWidget';
import widgets from '../index';

const noop = () => {};

const nullableSchema = {
    type: ['string', 'null'],
    oneOf: [
        { 'const': null, title: '- Undefined -' },
        { 'const': 'grid', title: 'grid' }
    ]
};
const nullableOptions = {
    enumOptions: [
        { value: null, label: '- Undefined -' },
        { value: 'grid', label: 'grid' }
    ]
};

const notNullableSchema = {
    type: ['string', 'null'],
    oneOf: [
        { 'const': 'unknown', title: 'unknown' },
        { 'const': 'continual', title: 'continual' }
    ]
};
const notNullableOptions = {
    enumOptions: [
        { value: 'unknown', label: 'unknown' },
        { value: 'continual', label: 'continual' }
    ]
};

describe('SelectWidget', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('should hide the placeholder option when the enum options include a null value', () => {
        ReactDOM.render(<SelectWidget
            id="root_field"
            schema={nullableSchema}
            options={nullableOptions}
            value={null}
            onChange={noop}
            onBlur={noop}
            onFocus={noop}
        />, document.getElementById('container'));
        const select = document.querySelector('select');
        expect(select).toBeTruthy();
        const options = select.querySelectorAll('option');
        expect([...options].map(option => option.innerHTML)).toEqual(['- Undefined -', 'grid']);
        expect(select.value).toBe('0');
    });
    it('should keep the placeholder option when the enum options do not include a null value', () => {
        ReactDOM.render(<SelectWidget
            id="root_field"
            schema={notNullableSchema}
            options={notNullableOptions}
            onChange={noop}
            onBlur={noop}
            onFocus={noop}
        />, document.getElementById('container'));
        const select = document.querySelector('select');
        expect(select).toBeTruthy();
        const options = select.querySelectorAll('option');
        expect(options.length).toBe(3);
        expect(options[0].value).toBe('');
        expect(select.value).toBe('');
    });
    it('should return null on change when the null option is selected', (done) => {
        ReactDOM.render(<SelectWidget
            id="root_field"
            schema={nullableSchema}
            options={nullableOptions}
            value="grid"
            onChange={(value) => {
                try {
                    expect(value).toBe(null);
                } catch (e) {
                    done(e);
                    return;
                }
                done();
            }}
            onBlur={noop}
            onFocus={noop}
        />, document.getElementById('container'));
        const select = document.querySelector('select');
        expect(select.value).toBe('1');
        Simulate.change(select, { target: { value: '0' } });
    });
});

describe('SelectWidget in Form', () => {
    const formSchema = {
        type: 'object',
        properties: {
            spatial_representation_type: nullableSchema,
            maintenance_frequency: notNullableSchema
        }
    };
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('should render the placeholder option only for the oneOf without a null value', () => {
        ReactDOM.render(<Form
            schema={formSchema}
            formData={{ spatial_representation_type: null }}
            widgets={widgets}
            validator={validator}
        />, document.getElementById('container'));
        const spatialSelect = document.querySelector('#root_spatial_representation_type');
        expect(spatialSelect).toBeTruthy();
        expect([...spatialSelect.querySelectorAll('option')].map(option => option.innerHTML)).toEqual(['- Undefined -', 'grid']);
        expect(spatialSelect.value).toBe('0');
        const frequencySelect = document.querySelector('#root_maintenance_frequency');
        expect(frequencySelect).toBeTruthy();
        const frequencyOptions = frequencySelect.querySelectorAll('option');
        expect(frequencyOptions.length).toBe(3);
        expect(frequencyOptions[0].value).toBe('');
        expect(frequencySelect.value).toBe('');
    });
    it('should not populate the form data with null when the value is missing', () => {
        let form;
        ReactDOM.render(<Form
            ref={(ref) => { form = ref; }}
            schema={formSchema}
            formData={{}}
            widgets={widgets}
            validator={validator}
        />, document.getElementById('container'));
        expect(form).toBeTruthy();
        expect(form.state.formData).toEqual({});
        expect('spatial_representation_type' in form.state.formData).toBe(false);
    });
    it('should update the form data with null when the null option is selected', (done) => {
        ReactDOM.render(<Form
            schema={formSchema}
            formData={{ spatial_representation_type: 'grid' }}
            widgets={widgets}
            validator={validator}
            onChange={({ formData }) => {
                try {
                    expect(formData.spatial_representation_type).toBe(null);
                } catch (e) {
                    done(e);
                    return;
                }
                done();
            }}
        />, document.getElementById('container'));
        const select = document.querySelector('#root_spatial_representation_type');
        expect(select.value).toBe('1');
        select.value = '0';
        Simulate.change(select);
    });
    it('should update the form data with undefined when the placeholder option is selected', (done) => {
        ReactDOM.render(<Form
            schema={formSchema}
            formData={{ maintenance_frequency: 'unknown' }}
            widgets={widgets}
            validator={validator}
            onChange={({ formData }) => {
                try {
                    expect(formData.maintenance_frequency).toBe(undefined);
                } catch (e) {
                    done(e);
                    return;
                }
                done();
            }}
        />, document.getElementById('container'));
        const select = document.querySelector('#root_maintenance_frequency');
        expect(select.value).toBe('0');
        select.value = '';
        Simulate.change(select);
    });
});
