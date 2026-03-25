/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import { Provider } from 'react-redux';
import DocumentsFiltersForm from '../DocumentsFiltersForm';

describe('DocumentsFiltersForm container', () => {
    const store = {
        dispatch: () => {},
        subscribe: () => {},
        getState: () => ({
            security: {
                user: { id: 1, name: 'testuser' }
            }
        })
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

    it('should render with defaults', () => {
        ReactDOM.render(
            <Provider store={store}>
                <DocumentsFiltersForm
                    query={{}}
                    onChange={() => {}}
                    onClear={() => {}}
                    onClose={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const filtersForm = document.querySelector('.ms-filters-form');
        expect(filtersForm).toBeTruthy();
    });

    it('should render without defaultQuery', () => {
        ReactDOM.render(
            <Provider store={store}>
                <DocumentsFiltersForm
                    query={{ q: 'test' }}
                    onChange={() => {}}
                    onClear={() => {}}
                    onClose={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const filtersForm = document.querySelector('.ms-filters-form');
        expect(filtersForm).toBeTruthy();
    });

    it('should render with defaultQuery', () => {
        ReactDOM.render(
            <Provider store={store}>
                <DocumentsFiltersForm
                    query={{}}
                    defaultQuery={{ f: 'document' }}
                    onChange={() => {}}
                    onClear={() => {}}
                    onClose={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const filtersForm = document.querySelector('.ms-filters-form');
        expect(filtersForm).toBeTruthy();
    });

    it('should have clear filters button disabled when only defaultQuery is present', () => {
        ReactDOM.render(
            <Provider store={store}>
                <DocumentsFiltersForm
                    query={{}}
                    defaultQuery={{ f: 'document' }}
                    fields={[]}
                    onChange={() => {}}
                    onClear={() => {}}
                    onClose={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const buttons = document.querySelectorAll('.ms-filters-form button');
        const clearButton = Array.from(buttons).find(btn => btn.querySelector('span'));
        expect(clearButton).toBeTruthy();
        expect(clearButton.disabled).toBe(true);
    });

    it('should have clear filters button enabled when user filters are applied', () => {
        ReactDOM.render(
            <Provider store={store}>
                <DocumentsFiltersForm
                    query={{ 'filter{category.identifier.in}': ['test-category'] }}
                    defaultQuery={{ f: 'document' }}
                    fields={[]}
                    onChange={() => {}}
                    onClear={() => {}}
                    onClose={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const buttons = document.querySelectorAll('.ms-filters-form button');
        const clearButton = Array.from(buttons).find(btn => btn.querySelector('span'));
        expect(clearButton).toBeTruthy();
        expect(clearButton.disabled).toBe(false);
    });

    it('should call onClear when clear button is clicked', (done) => {
        ReactDOM.render(
            <Provider store={store}>
                <DocumentsFiltersForm
                    query={{ 'filter{category.identifier.in}': ['test-category'] }}
                    defaultQuery={{ f: 'document' }}
                    fields={[]}
                    onChange={() => {}}
                    onClear={() => {
                        done();
                    }}
                    onClose={() => {}}
                />
            </Provider>,
            document.getElementById('container')
        );
        const buttons = document.querySelectorAll('.ms-filters-form button');
        const clearButton = Array.from(buttons).find(btn =>
            btn.querySelector('span') && !btn.disabled
        );
        expect(clearButton).toBeTruthy();
        clearButton.click();
    });

    it('should call onClose when close button is clicked', (done) => {
        ReactDOM.render(
            <Provider store={store}>
                <DocumentsFiltersForm
                    query={{}}
                    fields={[]}
                    onChange={() => {}}
                    onClear={() => {}}
                    onClose={() => {
                        done();
                    }}
                />
            </Provider>,
            document.getElementById('container')
        );
        const buttons = document.querySelectorAll('.ms-filters-form button');
        const closeButton = Array.from(buttons).find(btn =>
            btn.querySelector('.glyphicon-1-close')
        );
        expect(closeButton).toBeTruthy();
        closeButton.click();
    });
});
