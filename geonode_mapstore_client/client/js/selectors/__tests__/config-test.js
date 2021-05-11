/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { setConfigProp } from "@mapstore/framework/utils/ConfigUtils";
import {
    getParsedGeoNodeConfiguration,
    getCustomMenuFilters
} from '../config';

describe('config selector', () => {
    afterEach((done) => {
        setConfigProp('monitorState', undefined);
        setConfigProp('geoNodeConfiguration', undefined);
        setTimeout(done);
    });
    it('getParsedGeoNodeConfiguration', () => {
        setConfigProp('monitorState', [
            {
                "name": "user",
                "path": "security.user"
            }
        ]);
        setConfigProp('geoNodeConfiguration', {
            "menu": {
                "items": [
                    {
                        "type": "link",
                        "href": "{'/user/' + state('user').pk}",
                        "labelId": "labelId",
                        "authenticated": true
                    }
                ],
                "rightItems": [
                    {
                        "type": "link",
                        "href": "/#",
                        "labelId": "labelId",
                        "authenticated": false
                    }
                ]
            },
            "navbar": {
                "items": [
                    {
                        "type": "link",
                        "href": "/#",
                        "labelId": "labelId"
                    }
                ]
            },
            "cardsMenu": {
                "items": []
            },
            "footer": {
                "items": [{
                    "type": "link",
                    "href": "/#",
                    "labelId": "labelId"
                }]
            },
            "cardOptions": {
                "items": [{
                    "type": "link",
                    "href": "/#",
                    "labelId": "labelId"
                }]
            },
            "filtersForm": {
                "items": [{
                    "id": "filter-id",
                    "type": "select",
                    "labelId": "labelId",
                    "options": []
                }]
            }
        });

        const state = {
            security: {
                user: { pk: 1 }
            }
        };
        const parsedConfiguration = getParsedGeoNodeConfiguration(state);
        expect(parsedConfiguration.menuItemsLeftAllowed).toEqual([{
            "type": "link",
            "href": "/user/1",
            "labelId": "labelId",
            "authenticated": true
        }]);
        expect(parsedConfiguration.menuItemsRightAllowed).toEqual([]);
        expect(parsedConfiguration.navbarItemsAllowed).toEqual([{
            "type": "link",
            "href": "/#",
            "labelId": "labelId"
        }]);
        expect(parsedConfiguration.filterMenuItemsAllowed).toEqual([]);
        expect(parsedConfiguration.footerMenuItemsAllowed).toEqual([{
            "type": "link",
            "href": "/#",
            "labelId": "labelId"
        }]);
        expect(parsedConfiguration.cardOptionsItemsAllowed).toEqual([{
            "type": "link",
            "href": "/#",
            "labelId": "labelId"
        }]);
        expect(parsedConfiguration.filtersFormItemsAllowed).toEqual([{
            "id": "filter-id",
            "type": "select",
            "labelId": "labelId",
            "options": []
        }]);
    });
    it('getParsedGeoNodeConfiguration', () => {
        setConfigProp('monitorState', [
            {
                "name": "user",
                "path": "security.user"
            }
        ]);
        setConfigProp('geoNodeConfiguration', {
            "menu": {
                "items": [
                    {
                        "id": "my-resources",
                        "labelId": "myResources",
                        "type": "filter",
                        "query": {
                            "filter{owner.pk}": "{state('user') && state('user').pk}"
                        },
                        "authenticated": true
                    },
                    {
                        "id": "map",
                        "labelId": "map",
                        "type": "filter",
                        "query": {
                            "filter{resource_type}": "map"
                        },
                        "authenticated": false
                    }
                ]
            },
            "filtersForm": {
                "items": [{
                    "id": "pending-approval",
                    "labelId": "pendingApproval",
                    "type": "filter",
                    "query": {
                        "filter{is_approved}": false
                    },
                    "authenticated": true
                },
                {
                    "type": "group",
                    "labelId": "customFiltersTitle",
                    "authenticated": true,
                    "items": [
                        {
                            "id": "approved-resources",
                            "labelId": "approvedResources",
                            "type": "filter",
                            "query": {
                                "filter{is_approved}": true
                            }
                        }
                    ]
                }]
            }
        });

        const state = {
            security: {
                user: { pk: 1 }
            }
        };
        const menuFilters = getCustomMenuFilters(state);
        expect(menuFilters).toEqual([
            {
                id: 'my-resources',
                labelId: 'myResources',
                type: 'filter',
                query: { 'filter{owner.pk}': 1 },
                authenticated: true
            },
            {
                id: 'pending-approval',
                labelId: 'pendingApproval',
                type: 'filter',
                query: { 'filter{is_approved}': false },
                authenticated: true
            },
            {
                id: 'approved-resources',
                labelId: 'approvedResources',
                type: 'filter',
                query: { 'filter{is_approved}': true }
            }
        ]);
    });
});
