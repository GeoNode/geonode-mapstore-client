/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import expect from 'expect';
import ReactDOM from 'react-dom';
import { Simulate } from 'react-dom/test-utils';

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
    describe('test accordion field', () => {
        const isExpanded = () => window.localStorage.getItem("accordionsExpanded")?.includes('test-accordion');
        it('should render field of type accordion of items filter with default style', () => {
            const items = [
                {
                    "type": "accordion",
                    "id": "accordion",
                    "labelId": "gnhome.accordion",
                    "items": [
                        {
                            "type": "filter",
                            "id": 'layer',
                            "labelId": "gnhome.layers"
                        }
                    ]
                }
            ];
            ReactDOM.render( <FilterItems id="test" items={items}/>, document.getElementById("container"));
            const filterItemsAccordionNode = document.querySelector('.gn-accordion');
            expect(filterItemsAccordionNode).toBeTruthy();

            const filterItemsAccordionTitleNode = document.querySelector('.accordion-title button');
            expect(filterItemsAccordionTitleNode).toBeTruthy();

            !isExpanded() && Simulate.click(filterItemsAccordionTitleNode);

            const filterItemsFilterNode = document.querySelector('input[type="checkbox"]');
            expect(filterItemsFilterNode).toBeTruthy();
            isExpanded() && Simulate.click(filterItemsAccordionTitleNode);
        });
        it('should render field of type accordion of items filter with style as facet', () => {
            const items = [
                {
                    "type": "accordion",
                    "id": "accordion",
                    "labelId": "gnhome.accordion",
                    "items": [
                        {
                            "type": "filter",
                            "id": 'layer',
                            "style": 'facet',
                            "labelId": "gnhome.layers"
                        }
                    ]
                }
            ];
            ReactDOM.render( <FilterItems id="test" items={items}/>, document.getElementById("container"));
            const filterItemsAccordionNode = document.querySelector('.gn-accordion');
            expect(filterItemsAccordionNode).toBeTruthy();

            const filterItemsAccordionTitleNode = document.querySelector('.accordion-title button');
            expect(filterItemsAccordionTitleNode).toBeTruthy();

            !isExpanded() && Simulate.click(filterItemsAccordionTitleNode);

            const filterItemsFilterNodeFacet = document.querySelector('.facet');
            expect(filterItemsFilterNodeFacet).toBeTruthy();

            isExpanded() && Simulate.click(filterItemsAccordionTitleNode);
        });
        it('should render field date-range from', (done) => {
            const items = [
                {
                    type: 'date-range',
                    filterKey: 'date',
                    labelId: 'gnviewer.dateFilter'
                }
            ];
            ReactDOM.render( <FilterItems id="test" items={items} onChange={(value) => {
                try {
                    expect(value['filter{date.gte}']).toBeTruthy();
                    expect(value['filter{date.gte}'].split('T')[1]).toBe('00:00:00');
                    done();
                } catch (e) {
                    done(e);
                }
            }}/>, document.getElementById("container"));

            const dateTimePickersLabels = document.querySelectorAll('label > span');
            expect(dateTimePickersLabels.length).toBe(2);
            expect([...dateTimePickersLabels].map(node => node.innerText)).toEqual([ 'gnviewer.dateFilter.from', 'gnviewer.dateFilter.to' ]);
            const dateTimePickers = document.querySelectorAll('.rw-datetimepicker');
            expect(dateTimePickers.length).toBe(2);
            const dateTimePickersButtons = document.querySelectorAll('.rw-btn-calendar');
            expect(dateTimePickersButtons.length).toBe(2);

            Simulate.click(dateTimePickersButtons[0]);

            const calendarButton = document.querySelectorAll('tbody .rw-btn');

            Simulate.click(calendarButton[0]);
        });
        it('should render field date-range to', (done) => {
            const items = [
                {
                    type: 'date-range',
                    filterKey: 'date',
                    labelId: 'gnviewer.dateFilter'
                }
            ];
            ReactDOM.render( <FilterItems id="test" items={items} onChange={(value) => {
                try {
                    expect(value['filter{date.lte}']).toBeTruthy();
                    expect(value['filter{date.lte}'].split('T')[1]).toBe('23:59:59');
                    done();
                } catch (e) {
                    done(e);
                }
            }}/>, document.getElementById("container"));

            const dateTimePickersLabels = document.querySelectorAll('label > span');
            expect(dateTimePickersLabels.length).toBe(2);
            expect([...dateTimePickersLabels].map(node => node.innerText)).toEqual([ 'gnviewer.dateFilter.from', 'gnviewer.dateFilter.to' ]);
            const dateTimePickers = document.querySelectorAll('.rw-datetimepicker');
            expect(dateTimePickers.length).toBe(2);
            const dateTimePickersButtons = document.querySelectorAll('.rw-btn-calendar');
            expect(dateTimePickersButtons.length).toBe(2);

            Simulate.click(dateTimePickersButtons[1]);

            const calendarButton = document.querySelectorAll('tbody .rw-btn');

            Simulate.click(calendarButton[0]);
        });
    });

});
