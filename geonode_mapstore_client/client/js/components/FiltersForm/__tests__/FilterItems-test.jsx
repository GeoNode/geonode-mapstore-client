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
import FilterItems from '../FilterItems';

describe('FilterItems component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });
    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('should render field of type link', () => {
        const items = [
            {
                "type": "link",
                "href": "/layers/",
                "labelId": "gnhome.layers"
            }
        ];
        ReactDOM.render( <FilterItems items={items}/>, document.getElementById("container"));
        const filterItemsLinkNode = document.querySelector('.gn-filter-form-link');
        expect(filterItemsLinkNode).toBeTruthy();
    });
    it('should render field of type divider', () => {
        const items = [
            {
                "type": "divider"
            }
        ];
        ReactDOM.render( <FilterItems items={items}/>, document.getElementById("container"));
        const filterItemsDividerNode = document.querySelector('.gn-filter-form-divider');
        expect(filterItemsDividerNode).toBeTruthy();
    });
    it('should render field of type select', () => {
        const items = [
            {
                "labelId": "gnhome.resourceTypes",
                "placeholderId": "gnhome.resourceTypesPlaceholder",
                "type": "select",
                "suggestionsRequestKey": "resourceTypes"
            }
        ];
        const suggestionsRequestTypes = { resourceTypes: { loadOptions: () => new Promise(resolve => resolve([])) }};
        ReactDOM.render( <FilterItems items={items} suggestionsRequestTypes={suggestionsRequestTypes}/>, document.getElementById("container"));
        const filterItemsSelectNode = document.querySelector('.Select');
        expect(filterItemsSelectNode).toBeTruthy();
    });
    it('should render field of type select with options', () => {
        const items = [
            {
                "id": "resource_type",
                "labelId": "gnhome.resourceTypes",
                "placeholderId": "gnhome.resourceTypesPlaceholder",
                "type": "select",
                "options": ["layer", "map"]
            }
        ];
        ReactDOM.render( <FilterItems items={items}/>, document.getElementById("container"));
        const filterItemsSelectNode = document.querySelector('.Select');
        expect(filterItemsSelectNode).toBeTruthy();
    });
    it('should render field of type filter', () => {
        const items = [
            {
                "id": "approved-resources",
                "labelId": "gnhome.pendingApproval",
                "type": "filter",
                "query": {
                    "filter{is_approved}": false
                }
            }
        ];
        ReactDOM.render( <FilterItems items={items}/>, document.getElementById("container"));
        const filterItemsFilterNode = document.querySelector('input[type="checkbox"]');
        expect(filterItemsFilterNode).toBeTruthy();
    });
    it('should render field of type group', () => {
        const items = [
            {
                "type": "group",
                "labelId": "gnhome.customFiltersTitle",
                "items": [
                    {
                        "type": "link",
                        "href": "/layers/",
                        "labelId": "gnhome.layers"
                    }
                ]
            }
        ];
        ReactDOM.render( <FilterItems items={items}/>, document.getElementById("container"));
        const filterItemsGroupNode = document.querySelector('.gn-filter-form-group-title');
        expect(filterItemsGroupNode).toBeTruthy();
    });
});
