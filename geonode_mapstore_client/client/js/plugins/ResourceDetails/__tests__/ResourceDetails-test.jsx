/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { getConfigProp, setConfigProp } from '@mapstore/framework/utils/ConfigUtils';

import { mergeConfig, ResourceDetailsPanel } from '../ResourceDetails';

describe('mergeConfig', () => {
    const defaultTabs = [
        {
            id: 'info',
            type: 'tab',
            labelId: 'gnviewer.info',
            items: [
                { id: 'title', type: 'text', labelId: 'gnviewer.title', value: 'Default Title' },
                { id: 'owner', type: 'link', labelId: 'gnviewer.owner', value: 'admin' },
                { id: 'viewFullMetadata', type: 'link', style: 'label', labelId: 'gnviewer.viewFullMetadata' }
            ]
        },
        {
            id: 'locations',
            type: 'locations',
            labelId: 'gnviewer.locations',
            items: '{getExtentObject(state(\'gnResourceData\'))}'
        }
    ];

    it('handles empty or non-array inputs', () => {
        expect(mergeConfig()).toEqual([]);
        expect(mergeConfig(defaultTabs)).toBe(defaultTabs);
        expect(mergeConfig(defaultTabs, [])).toBe(defaultTabs);
        expect(mergeConfig(defaultTabs, null)).toBe(defaultTabs);
        expect(mergeConfig(defaultTabs, 'invalid')).toBe(defaultTabs);

        const overrides = [{ id: 'custom' }];
        expect(mergeConfig(null, overrides)).toBe(overrides);
        expect(mergeConfig(null, 'invalid')).toEqual([]);
        expect(mergeConfig('invalid', null)).toEqual([]);
    });

    it('merges matching items recursively and appends new ones', () => {
        const snapshot = JSON.parse(JSON.stringify(defaultTabs));
        const overrides = [
            {
                id: 'info',
                labelId: 'custom.info',
                items: [
                    { id: 'title', labelId: 'custom.title', customProp: true },
                    { id: 'doi', type: 'text', label: 'DOI', value: '10.1000/1' }
                ]
            },
            {
                id: 'customTab',
                type: 'tab',
                label: 'Custom Tab',
                items: [{ id: 'extra', type: 'text', label: 'Extra', value: '1' }]
            }
        ];

        const merged = mergeConfig(defaultTabs, overrides);

        expect(defaultTabs).toEqual(snapshot);
        expect(merged.map(tab => tab.id)).toEqual(['info', 'locations', 'customTab']);
        expect(merged[0].labelId).toBe('custom.info');
        expect(merged[0].items).toEqual([
            { id: 'title', type: 'text', labelId: 'custom.title', value: 'Default Title', customProp: true },
            { id: 'owner', type: 'link', labelId: 'gnviewer.owner', value: 'admin' },
            { id: 'doi', type: 'text', label: 'DOI', value: '10.1000/1' },
            { id: 'viewFullMetadata', type: 'link', style: 'label', labelId: 'gnviewer.viewFullMetadata' }
        ]);
        expect(merged[1]).toEqual(defaultTabs[1]);
        expect(merged[2]).toEqual(overrides[1]);
    });

    it('clears items on empty array and replaces non-array items', () => {
        const merged = mergeConfig(defaultTabs, [
            { id: 'info', items: [] },
            { id: 'locations', items: '{customExpression()}' }
        ]);

        expect(merged[0].items).toEqual([]);
        expect(merged[1].items).toBe('{customExpression()}');
    });

    it('hides entries with hide: true and strips hide property', () => {
        const merged = mergeConfig(defaultTabs, [
            {
                id: 'info',
                hide: false,
                items: [
                    { id: 'owner', hide: true },
                    { id: 'title', hide: false, value: 'New Title' },
                    { id: 'unmatchedHidden', hide: true, label: 'Ignored' },
                    { id: 'doi', hide: false, type: 'text', label: 'DOI', value: '10.1/a' }
                ]
            },
            { id: 'locations', hide: true },
            { id: 'ignoredTab', hide: true }
        ]);

        expect(merged.map(tab => tab.id)).toEqual(['info']);
        expect('hide' in merged[0]).toBe(false);
        expect(merged[0].items).toEqual([
            { id: 'title', type: 'text', labelId: 'gnviewer.title', value: 'New Title' },
            { id: 'doi', type: 'text', label: 'DOI', value: '10.1/a' },
            { id: 'viewFullMetadata', type: 'link', style: 'label', labelId: 'gnviewer.viewFullMetadata' }
        ]);
        expect('hide' in merged[0].items[0]).toBe(false);
        expect('hide' in merged[0].items[1]).toBe(false);
    });

    it('keeps viewFullMetadata last unless hidden', () => {
        const withOverriddenLast = mergeConfig(defaultTabs[0].items, [
            { id: 'viewFullMetadata', label: 'Metadata' },
            { id: 'uuid', type: 'text', label: 'UUID', value: 'abc-123' }
        ]);
        expect(withOverriddenLast.map(item => item.id)).toEqual([
            'title',
            'owner',
            'uuid',
            'viewFullMetadata'
        ]);
        expect(withOverriddenLast[3].label).toBe('Metadata');

        const baseWithoutLast = [
            { id: 'title', type: 'text', label: 'Title', value: 'T' }
        ];
        const withAddedLastBeforeOther = mergeConfig(baseWithoutLast, [
            { id: 'viewFullMetadata', type: 'link', label: 'Full Metadata' },
            { id: 'doi', type: 'text', label: 'DOI', value: '10.1/x' }
        ]);
        expect(withAddedLastBeforeOther.map(item => item.id)).toEqual([
            'title',
            'doi',
            'viewFullMetadata'
        ]);

        const withHiddenLast = mergeConfig(defaultTabs[0].items, [
            { id: 'viewFullMetadata', hide: true },
            { id: 'uuid', type: 'text', label: 'UUID', value: 'abc-123' }
        ]);
        expect(withHiddenLast.map(item => item.id)).toEqual([
            'title',
            'owner',
            'uuid'
        ]);
    });

    it('handles id-less items, id 0, and duplicate ids', () => {
        const defaultsWithEdgeItems = [
            null,
            { id: 0, value: 'zero-default' },
            { label: 'no-id-default' },
            { id: 'a', value: 1 }
        ];
        const overrides = [
            null,
            undefined,
            'primitive',
            { label: 'missing-id' },
            { id: null, label: 'null-id' },
            { id: 0, value: 'zero-updated' },
            { id: 'a', value: 2 },
            { id: 'a', value: 3 },
            { id: 'b', value: 1 },
            { id: 'b', value: 2 }
        ];

        expect(mergeConfig(defaultsWithEdgeItems, overrides)).toEqual([
            null,
            { id: 0, value: 'zero-updated' },
            { label: 'no-id-default' },
            { id: 'a', value: 3 },
            { id: 'b', value: 2 }
        ]);
    });
});

describe('ResourceDetailsPanel tabs and tabsOverride', () => {
    const resource = {
        pk: 1,
        title: 'Test Resource',
        resource_type: 'dataset',
        owner: { username: 'admin' },
        perms: []
    };

    const createStore = () => ({
        dispatch: () => {},
        subscribe: () => {},
        getState: () => ({
            resources: {},
            gnresource: { data: resource },
            router: { location: { search: '' } }
        })
    });

    const renderPanel = (props = {}) => {
        ReactDOM.render(
            <Provider store={createStore()}>
                <MemoryRouter>
                    <IntlProvider locale="en" messages={{}}>
                        <ResourceDetailsPanel
                            show
                            resource={resource}
                            onShow={() => {}}
                            onClose={() => {}}
                            onClearResource={() => {}}
                            {...props}
                        />
                    </IntlProvider>
                </MemoryRouter>
            </Provider>,
            document.getElementById('container')
        );
    };

    let prevGeoNodeSettings;

    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        prevGeoNodeSettings = getConfigProp('geoNodeSettings');
        setConfigProp('geoNodeSettings', { defaultThumbnailSize: { width: 200, height: 500 } });
        window.overrideNewMapConfig = (cfg) => cfg;
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setConfigProp('geoNodeSettings', prevGeoNodeSettings);
        delete window.overrideNewMapConfig;
        setTimeout(done);
    });

    const getTabTitles = () => Array.from(document.querySelectorAll('.ms-details-info .nav li a')).map(el => el.textContent);
    const getInfoText = () => document.querySelector('.ms-details-info-fields')?.textContent || '';

    it('uses default tabs when tabs is undefined', () => {
        renderPanel();
        const tabTitles = getTabTitles();
        expect(tabTitles).toContain('gnviewer.info');
        expect(tabTitles).toContain('gnviewer.assets');
        expect(tabTitles).toContain('gnviewer.security');
        expect(tabTitles).toContain('gnviewer.settings');
        expect(getInfoText()).toContain('gnviewer.viewFullMetadata');
    });

    it('replaces default tabs completely when tabs is provided', () => {
        renderPanel({
            tabs: [
                {
                    id: 'custom',
                    type: 'tab',
                    label: 'Custom Tab',
                    items: [{ id: 'customField', type: 'text', label: 'Custom Label', value: 'Custom Value' }]
                }
            ]
        });
        expect(getTabTitles()).toEqual(['Custom Tab']);
        expect(getInfoText()).toContain('Custom Value');
        expect(getInfoText()).toExclude('gnviewer.viewFullMetadata');
    });

    it('overrides default tabs by id when tabsOverride is provided without tabs', () => {
        renderPanel({
            tabsOverride: [
                {
                    id: 'info',
                    labelId: 'custom.info',
                    items: [{ id: 'customField', type: 'text', label: 'Added Field', value: 'Override Value' }]
                },
                {
                    id: 'extra',
                    type: 'tab',
                    label: 'Extra Tab',
                    items: [{ id: 'extraItem', type: 'text', label: 'Extra', value: 'Added' }]
                }
            ]
        });
        const tabTitles = getTabTitles();
        expect(tabTitles).toContain('custom.info');
        expect(tabTitles).toContain('Extra Tab');
        expect(tabTitles).toExclude('gnviewer.info');
        expect(getInfoText()).toContain('Override Value');
        expect(getInfoText()).toContain('gnviewer.viewFullMetadata');
    });

    it('applies tabsOverride by id on top of custom tabs', () => {
        renderPanel({
            tabs: [
                {
                    id: 'custom',
                    type: 'tab',
                    label: 'Custom Tab',
                    items: [
                        { id: 'first', type: 'text', label: 'First', value: 'Initial' },
                        { id: 'second', type: 'text', label: 'Second', value: 'Keep' }
                    ]
                }
            ],
            tabsOverride: [
                {
                    id: 'custom',
                    label: 'Custom Overridden',
                    items: [{ id: 'first', value: 'Updated' }]
                }
            ]
        });
        expect(getTabTitles()).toEqual(['Custom Overridden']);
        expect(getInfoText()).toContain('Updated');
        expect(getInfoText()).toContain('Keep');
        expect(getInfoText()).toExclude('Initial');
    });
});
