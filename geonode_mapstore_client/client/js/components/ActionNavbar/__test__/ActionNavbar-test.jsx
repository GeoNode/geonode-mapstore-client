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
import ActionNavbar from '../ActionNavbar';


const conf = {
    leftItems: [
        {
            "labelId": "gnhome.data",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/layers/?limit=5",
                    "labelId": "gnhome.layers",
                    "badge": 1,
                    "permissions": [],
                    "allowedRoles": []
                },
                {
                    "type": "link",
                    "href": "/documents/?limit=5",
                    "labelId": "gnhome.documents",
                    "badge": 1,
                    "permissions": [],
                    "allowedRoles": []
                },
                {
                    "type": "link",
                    "href": "/services/?limit=5",
                    "labelId": "gnhome.remoteServices",
                    "permissions": [],
                    "allowedRoles": []
                }
            ]
        },
        {
            "labelId": "gnhome.maps",
            "authenticated": false,
            "type": "link",
            "subType": "tag",
            "href": "/maps/?limit=5",
            "badge": 2
        },
        {
            "type": "link",
            "subType": "tag",
            "href": "/apps/?limit=5",
            "labelId": "gnhome.apps",
            "badge": 5
        },
        {
            "labelId": "gnhome.about",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/people/",
                    "labelId": "gnhome.people"
                },
                {
                    "type": "link",
                    "href": "/groups/",
                    "labelId": "gnhome.groups"
                },
                {
                    "type": "link",
                    "href": "/groups/categories/",
                    "labelId": "gnhome.groupsCategories"
                }
            ]
        },
        {
            "type": "link",
            "subType": "tag",
            "href": "/apps/?limit=5",
            "labelId": "gnhome.apps",
            "badge": 5
        },
        {
            "labelId": "gnhome.about",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/people/",
                    "labelId": "gnhome.people"
                },
                {
                    "type": "link",
                    "href": "/groups/",
                    "labelId": "gnhome.groups"
                },
                {
                    "type": "link",
                    "href": "/groups/categories/",
                    "labelId": "gnhome.groupsCategories"
                }
            ]
        }
    ],
    rightItems: [
        {
            "labelId": "gnhome.data",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/layers/?limit=5",
                    "labelId": "gnhome.layers",
                    "badge": 1,
                    "permissions": [],
                    "allowedRoles": []
                },
                {
                    "type": "link",
                    "href": "/documents/?limit=5",
                    "labelId": "gnhome.documents",
                    "badge": 1,
                    "permissions": [],
                    "allowedRoles": []
                },
                {
                    "type": "link",
                    "href": "/services/?limit=5",
                    "labelId": "gnhome.remoteServices",
                    "permissions": [],
                    "allowedRoles": []
                }
            ]
        },
        {
            "labelId": "gnhome.maps",
            "authenticated": false,
            "type": "link",
            "subType": "tag",
            "href": "/maps/?limit=5",
            "badge": 2
        },
        {
            "labelId": "gnhome.maps",
            "authenticated": false,
            "type": "link",
            "subType": "tag",
            "href": "/maps/?limit=5",
            "badge": 2
        },
        {
            "labelId": "gnhome.maps",
            "authenticated": false,
            "type": "link",
            "subType": "tag",
            "href": "/maps/?limit=5",
            "badge": 2
        },
        {
            "labelId": "gnhome.maps",
            "authenticated": false,
            "type": "link",
            "subType": "tag",
            "href": "/maps/?limit=5",
            "badge": 2
        }
    ]

};

describe('Test GeoNode action navbar component', () => {
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
        ReactDOM.render( <ActionNavbar/>, document.getElementById("container"));
        const el = document.querySelector('.gn-action-navbar');
        expect(el).toExist();
    });

    it('should render left content right content', () => {
        ReactDOM.render( <ActionNavbar
            leftItems={conf.leftItems.items}
            rightItems={conf.rightItems.items}
        />, document.getElementById("container"));

        const el = document.querySelector('.gn-action-navbar');
        expect(el).toExist();
        const navBarContent = document.querySelector('.gn-action-navbar-content');
        expect(navBarContent).toExist();
        const navBarContentRight = document.querySelector('.gn-action-navbar-content-right');
        expect(navBarContentRight).toExist();
        const navBarContentLeft = document.querySelector('.gn-brand-navbar-left-side');
        expect(navBarContentLeft).toExist();

    });

});
