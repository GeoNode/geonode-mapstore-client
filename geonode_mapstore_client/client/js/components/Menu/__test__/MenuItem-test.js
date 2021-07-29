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
import MenuItem from '../MenuItem';

const Item = {
    "labelId": "gnhome.data",
    "type": "dropdown",
    "items": [
        {
            "type": "link",
            "href": "/datasets/?limit=5",
            "labelId": "gnhome.datasets",
            "badge": "${datasetsTotalCount}"
        },
        {
            "type": "link",
            "href": "/documents/?limit=5",
            "labelId": "gnhome.documents",
            "badge": "${documentsTotalCount}"
        },
        {
            "type": "link",
            "href": "/services/?limit=5",
            "labelId": "gnhome.remoteServices"
        },
        {
            "type": "divider",
            "authenticated": true
        },
        {
            "type": "link",
            "href": "/layers/upload",
            "labelId": "gnhome.uploadLayer",
            "authenticated": true
        },
        {
            "type": "link",
            "href": "/documents/upload",
            "labelId": "gnhome.uploadDocument",
            "authenticated": true
        },
        {
            "type": "link",
            "href": "/services/register/",
            "labelId": "gnhome.addRemoteService",
            "authenticated": true,
            "allowedRoles": [
                "admin"
            ]
        }
    ]
};

const state = {};

describe('Test GeoNode MenuItem', () => {

    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('Test componet is rendered', () => {
        ReactDOM.render(<MenuItem item={Item}
            menuItemsProps={state}
            classItem={'classItem'} />,
        document.getElementById("container"));
        const container = document.getElementById('container');
        const el = container.querySelector('.classItem');
        expect(el).toExist();
    });

});
