/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import SaveModal from '@js/plugins/save/SaveModal';
import { act, Simulate } from 'react-dom/test-utils';

describe('SaveModal plugin component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div><div id="container"></div></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('should render with default', () => {
        ReactDOM.render(
            <SaveModal />, document.getElementById('container')
        );
        const modalNode = document.querySelector('.ms-resizable-modal');
        expect(modalNode).toBeFalsy();
    });
    it('should render when enabled', () => {
        ReactDOM.render(
            <SaveModal enabled />, document.getElementById('container')
        );
        const modalNode = document.querySelector('.ms-resizable-modal');
        expect(modalNode).toBeTruthy();
    });
    it('should trigger onClear when enabled change', (done) => {
        act(() => {
            ReactDOM.render(
                <SaveModal
                    contentId={1}
                    enabled
                    onClear={() => {
                        done();
                    }}
                />, document.getElementById('container')
            );
        });
        const modalNode = document.querySelector('.ms-resizable-modal');
        expect(modalNode).toBeTruthy();
    });
    it('should trigger onSave without id if update prop is false', (done) => {
        act(() => {
            ReactDOM.render(
                <SaveModal
                    update={false}
                    resource={{
                        title: 'Title'
                    }}
                    enabled
                    onSave={(id, metadata, reload) => {
                        expect(id).toBe(undefined);
                        expect(metadata).toEqual({
                            name: 'Title',
                            description: undefined,
                            thumbnail: undefined
                        });
                        expect(reload).toBe(true);
                        done();
                    }}
                />, document.getElementById('container')
            );
        });
        const modalNode = document.querySelector('.ms-resizable-modal');
        expect(modalNode).toBeTruthy();
        const buttonNodes = document.querySelectorAll('button');
        expect(buttonNodes.length).toBe(2);
        const saveButtonNode = buttonNodes[1];
        Simulate.click(saveButtonNode);
    });
    it('should trigger onSave with id if update prop is true', (done) => {
        act(() => {
            ReactDOM.render(
                <SaveModal
                    update
                    contentId={1}
                    resource={{
                        title: 'Title'
                    }}
                    enabled
                    onSave={(id, metadata, reload) => {
                        expect(id).toBe(1);
                        expect(metadata).toEqual({
                            name: 'Title',
                            description: undefined,
                            thumbnail: undefined
                        });
                        expect(reload).toBe(true);
                        done();
                    }}
                />, document.getElementById('container')
            );
        });
        const modalNode = document.querySelector('.ms-resizable-modal');
        expect(modalNode).toBeTruthy();
        const buttonNodes = document.querySelectorAll('button');
        expect(buttonNodes.length).toBe(2);
        const saveButtonNode = buttonNodes[1];
        Simulate.click(saveButtonNode);
    });
});
