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

import Permissions from '../Permissions';

describe('Permissions component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('default rendering of Permissions component', () => {
        ReactDOM.render(<Permissions/>, document.getElementById('container'));
        expect(document.getElementsByClassName('gn-share-permissions-container')[0]).toExist();
    });
    it('rendering with resource owner and permissions', () => {
        const testPermissions = {
            test1: [
                { value: 'none', labelId: `gnviewer.nonePermission` },
                { value: 'view', labelId: `gnviewer.viewPermission` }
            ]
        };
        const compactPermissions = {
            groups: [
                {
                    id: 1,
                    title: "testTitle",
                    name: "testTitle",
                    permissions: "view"
                }
            ],
            users: [
                {
                    id: 2,
                    username: "testUser",
                    permissions: "owner",
                    avatar: "test",
                    is_superuser: false,
                    is_staff: false
                }
            ]
        };
        ReactDOM.render(<Permissions permissionOptions={[testPermissions]} compactPermissions={compactPermissions}/>, document.getElementById('container'));
        expect(document.getElementsByClassName('gn-share-permissions-pinned')[0]).toExist();
        expect(document.getElementsByClassName('gn-share-permissions-name')?.length).toBe(3);
    });
});
