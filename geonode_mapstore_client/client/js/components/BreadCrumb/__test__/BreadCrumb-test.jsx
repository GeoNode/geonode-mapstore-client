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
import BreadCrumb from '../BreadCrumb';

const testConf = {
    titleItems: [
        {
            type: 'plugin',
            name: 'DetailViewerButton',
            Component: 'i'
        }
    ],
    resource: {
        title: 'test resource'
    },
    locationNew: '/new',
    locationEdit: '/edit/map'
};

describe('Test Genode BreadCrumb component', () => {
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
        ReactDOM.render(<BreadCrumb />, document.getElementById('container'));
        const el = document.querySelector('.gn-action-navbar-title');
        expect(el).toExist();
    });

    it('should render BreadCrumb Content', () => {
        ReactDOM.render(
            <BreadCrumb
                resource={testConf.resource}
                titleItems={testConf.titleItems}
            />,
            document.getElementById('container')
        );

        const breadcrumbWrapper = document.querySelector(
            '.gn-action-navbar-title'
        );
        const resourceTitle = document.querySelector(
            '.gn-action-navbar-resource-title'
        );
        expect(resourceTitle.innerHTML).toEqual('test resource');
        expect(breadcrumbWrapper.childElementCount).toBe(2);
    });
    it('should not show breadcrumb on new resource', () => {
        ReactDOM.render(
            <BreadCrumb
                location={testConf.locationNew}
            />,
            document.getElementById('container')
        );
        const el = document.querySelector('.gn-action-navbar-title');
        expect(el).toNotExist();
    });
    it('should not show breadcrumb on edit resource', () => {
        ReactDOM.render(
            <BreadCrumb
                location={testConf.locationEdit}
            />,
            document.getElementById('container')
        );
        const el = document.querySelector('.gn-action-navbar-title');
        expect(el).toNotExist();
    });
});
