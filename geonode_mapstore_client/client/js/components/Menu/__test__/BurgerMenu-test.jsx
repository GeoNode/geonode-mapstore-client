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
import BurgerMenu from '../BurgerMenu';

const MenuConf = {
    "items": [
        {
            "labelId": "gnhome.data",
            "type": "dropdown",
            "items": [
                {
                    "type": "link",
                    "href": "/layers/?limit=5",
                    "labelId": "gnhome.layers",
                    "badge": "${datasetsTotalCount}"
                },
                {
                    "type": "link",
                    "href": "/documents/?limit=5",
                    "labelId": "gnhome.documents",
                    "badge": "${documentsTotalCount}"
                }
            ]
        },
        {
            "labelId": "gnhome.maps",
            "type": "link",
            "href": "/maps/?limit=5",
            "authenticated": false,
            "badge": "${mapsTotalCount}"
        },
        {
            "type": "divider",
            "authenticated": true
        }

    ]
};


describe('Test GeoNode BurgerMenu', () => {
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
        ReactDOM.render(<BurgerMenu items={MenuConf.items} />, document.getElementById("container"));
        const el = document.querySelector('.gn-sub-flat-menu-container');
        expect(el).toExist();
    });

});
