/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import expect from 'expect';
import UploadCard from '../upload/UploadCard';

describe('upload card tests', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('renders upload card with defaults', () => {
        ReactDOM.render(<UploadCard />, document.getElementById('container'));
        const uploadCard = document.querySelector(
            '.gn-upload-card'
        );
        expect(uploadCard).toExist();
    });

    it('renders error card', () => {
        ReactDOM.render(<UploadCard state="INVALID" error={{code: 'test'}} />, document.getElementById('container'));
        const uploadCard = document.querySelector(
            '.gn-upload-card-error-message'
        );
        expect(uploadCard).toExist();
    });
});
