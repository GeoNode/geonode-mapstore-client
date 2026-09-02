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
import { Simulate } from 'react-dom/test-utils';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import { getEntryIdKey } from '@mapstore/framework/plugins/ResourcesCatalog/utils/PermissionUtils';

import ConnectedGeoLimits from '../GeoLimits';

let mockAxios;

const createStore = (state = {}) => ({
    dispatch: () => {},
    subscribe: () => {},
    getState: () => ({
        gnresource: {
            id: 1,
            data: {}
        },
        map: {},
        ...state
    })
});

describe('GeoLimits component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        // GeoLimits reads the default map configuration from this global
        window.overrideNewMapConfig = (config) => config;
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        mockAxios.restore();
        delete window.overrideNewMapConfig;
        setTimeout(done);
    });

    it('should render the geo limits trigger button', () => {
        const entry = { id: 10, type: 'user', name: 'admin' };
        ReactDOM.render(
            <Provider store={createStore()}>
                <ConnectedGeoLimits entry={entry} onUpdate={() => {}} />
            </Provider>,
            document.getElementById('container')
        );
        const button = document.querySelector('.gn-geo-limits, #container button') || document.querySelector('button');
        expect(button).toBeTruthy();
        expect(document.querySelector('.glyphicon-globe')).toBeTruthy();
    });

    it('should update geo limits using the entry id key and not the entry id (#2581)', () => {
        const entry = { id: 10, type: 'user', name: 'admin' };
        mockAxios.onGet(/security\/geolimits/).reply(200, '');
        const updates = [];
        const onUpdate = (...args) => updates.push(args);

        ReactDOM.render(
            <Provider store={createStore()}>
                <ConnectedGeoLimits entry={entry} onUpdate={onUpdate} />
            </Provider>,
            document.getElementById('container')
        );

        // opening the popover (entry has no loaded features) requests the geo limits
        Simulate.click(document.querySelector('button'));

        expect(updates.length).toBe(1);
        const [idKey, changes, refresh] = updates[0];
        // the fix: the entry id key (type-name couple) must be used, not the entry id
        expect(idKey).toBe(getEntryIdKey(entry));
        expect(idKey).toBe('user-admin');
        expect(idKey).toNotBe(entry.id);
        expect(changes).toEqual({ geoLimitsLoading: true });
        expect(refresh).toBe(true);
    });

    it('should compute the entry id key for a group entry', () => {
        const entry = { id: 5, type: 'group', name: 'registered' };
        mockAxios.onGet(/security\/geolimits/).reply(200, '');
        const updates = [];
        const onUpdate = (...args) => updates.push(args);

        ReactDOM.render(
            <Provider store={createStore()}>
                <ConnectedGeoLimits entry={entry} onUpdate={onUpdate} />
            </Provider>,
            document.getElementById('container')
        );

        Simulate.click(document.querySelector('button'));

        expect(updates.length).toBe(1);
        expect(updates[0][0]).toBe('group-registered');
    });
});
