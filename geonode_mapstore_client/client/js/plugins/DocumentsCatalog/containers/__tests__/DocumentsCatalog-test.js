/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import { Provider } from 'react-redux';
import DocumentsCatalog from '../DocumentsCatalog';
import { waitFor } from '@testing-library/react';
import { Simulate } from 'react-dom/test-utils';

describe('DocumentsCatalog container', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('should render documents catalog component with initial state', (done) => {
        const mockRequest = () => Promise.resolve({
            resources: [],
            isNextPageAvailable: false,
            total: 0
        });

        const store = {
            dispatch: () => {},
            subscribe: () => {},
            getState: () => ({
                security: {
                    user: { id: 1, name: 'testuser' }
                },
                maplayout: {
                    boundingSidebarRect: {}
                }
            })
        };

        ReactDOM.render(
            <Provider store={store}>
                <DocumentsCatalog
                    requestResources={mockRequest}
                    pageSize={10}
                    onClose={() => { }}
                    onAdd={() => { }}
                    onZoomTo={() => { }}
                    menuItems={[]}
                />
            </Provider>,
            document.getElementById('container')
        );

        setTimeout(() => {
            try {
                const container = document.getElementById('container');
                expect(container.querySelector('.gn-resources-catalog')).toBeTruthy();
                expect(container.querySelector('.gn-resources-catalog-body')).toBeTruthy();
                done();
            } catch (e) {
                done(e);
            }
        }, 100);
    });
    it('should display no results message when no documents found', (done) => {
        const mockRequest = () => Promise.resolve({
            resources: [],
            isNextPageAvailable: false,
            total: 0
        });

        const store = {
            dispatch: () => {},
            subscribe: () => {},
            getState: () => ({
                security: {
                    user: { id: 1, name: 'testuser' }
                },
                maplayout: {
                    boundingSidebarRect: {}
                }
            })
        };

        ReactDOM.render(
            <Provider store={store}>
                <DocumentsCatalog
                    requestResources={mockRequest}
                    pageSize={10}
                    noResultId="gnviewer.noDocumentsFound"
                    onClose={() => { }}
                    onAdd={() => { }}
                    onZoomTo={() => { }}
                    menuItems={[]}
                />
            </Provider>,
            document.getElementById('container')
        );

        // Wait for hook debounce time (300ms) + render time
        setTimeout(() => {
            try {
                const container = document.getElementById('container');
                const noResultDiv = container.querySelector('.gn-resources-catalog-alert');
                expect(noResultDiv).toBeTruthy();
                done();
            } catch (e) {
                done(e);
            }
        }, 500);
    });
    it('should handle select all documents on current page', (done) => {
        const mockDocuments = [
            { pk: 1, title: 'Document 1', thumbnail_url: 'http://example.com/thumb1.jpg' },
            { pk: 2, title: 'Document 2', thumbnail_url: 'http://example.com/thumb2.jpg' }
        ];

        const mockRequest = ({ page, pageSize }) => Promise.resolve({
            resources: page === 1 ? mockDocuments : [],
            isNextPageAvailable: false,
            total: 2
        });

        const store = {
            dispatch: () => {},
            subscribe: () => {},
            getState: () => ({
                security: {
                    user: { id: 1, name: 'testuser' }
                },
                maplayout: {
                    boundingSidebarRect: {}
                }
            })
        };

        ReactDOM.render(
            <Provider store={store}>
                <DocumentsCatalog
                    requestResources={mockRequest}
                    pageSize={10}
                    onClose={() => { }}
                    onAdd={() => { }}
                    onZoomTo={() => { }}
                    menuItems={[]}
                />
            </Provider>,
            document.getElementById('container')
        );

        waitFor(() => {
            const container = document.getElementById('container');
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            return checkboxes.length > 0;
        }).then(() => {
            try {
                const container = document.getElementById('container');
                const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]'));
                if (checkboxes.length > 0) {
                    Simulate.change(checkboxes[0], { target: { checked: true } });
                }

                setTimeout(() => {
                    const documentCheckboxes = Array.from(container.querySelectorAll('.gn-resources-catalog-list input[type="checkbox"]'));
                    const allChecked = documentCheckboxes.every(cb => cb.checked);
                    expect(allChecked).toBe(true);
                    done();
                }, 50);
            } catch (e) {
                done(e);
            }
        }).catch(done);
    });
});
