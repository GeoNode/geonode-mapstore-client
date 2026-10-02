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
import { Simulate } from 'react-dom/test-utils';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';

import DetailsAssets from '../DetailsAssets';

let mockAxios;

// sample structure for assets by #2630
const sampleAssets = [
    {
        "id": 1,
        "title": "Title of asset",
        "description": "long text describe the asset",
        "type": "shp",
        "created": "2026-08-27T17:06:28.407146Z",
        "deletable": false,
        "urls": {
            "download_url": "/api/v2/assets/1/download",
            "link": "/api/v2/assets/1/link"
        }
    },
    {
        "id": 2,
        "title": "Title of asset 2",
        "description": "long text describe the asset 2",
        "type": "shp",
        "created": "2026-08-27T17:06:28.407146Z",
        "deletable": true,
        "urls": {
            "download_url": "/api/v2/assets/2/download",
            "link": "/api/v2/assets/2/link"
        }
    }
];

// resource links containing at least one asset enable the initial assets request
const assetLinks = [{ link_type: 'data', extension: 'pdf', url: 'http://localhost/api/v2/assets/1/link' }];

const getAssetRows = () => document.querySelectorAll('.gn-details-assets-list .gn-details-assets-item');

describe('DetailsAssets component', () => {
    beforeEach((done) => {
        global.__DEVTOOLS__ = true;
        document.body.innerHTML = '<div id="container"></div>';
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });

    afterEach((done) => {
        delete global.__DEVTOOLS__;
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        mockAxios.restore();
        setTimeout(done);
    });

    it('should render the assets panel with the filter input and the empty message', () => {
        ReactDOM.render(
            <DetailsAssets />,
            document.getElementById('container')
        );
        expect(document.querySelector('.gn-details-assets')).toBeTruthy();
        expect(document.querySelector('.gn-details-assets-filter-input')).toBeTruthy();
        expect(document.querySelector('.gn-details-assets-empty')).toBeTruthy();
        expect(getAssetRows().length).toBe(0);
    });

    it('should render 1 row for each asset returned by new endpoint', (done) => {
        const resource = { pk: 10, links: assetLinks };

        mockAxios.onGet(new RegExp(`/api/v2/resources/${resource.pk}/asset`)).reply(200, sampleAssets);

        ReactDOM.render(
            <DetailsAssets resource={resource} />,
            document.getElementById('container')
        );

        setTimeout(() => {
            try {
                const assetRows = getAssetRows();
                expect(assetRows.length).toBe(sampleAssets.length);
                const links = document.querySelectorAll('.gn-details-assets-item td:first-child a');
                expect(links.length).toBe(sampleAssets.length);
                expect([...links].map((link) => link.textContent))
                    .toEqual(sampleAssets.map((asset) => asset.title));
            } catch (e) {
                done(e);
                return;
            }
            done();
        }, 100);
    });

    it('should not request the assets when resource links have no asset', (done) => {
        const resource = { pk: 10, links: [{ link_type: 'image', url: 'http://localhost/uploaded/thumbs/thumb.png' }] };

        mockAxios.onGet(new RegExp(`/api/v2/resources/${resource.pk}/asset`)).reply(200, sampleAssets);

        ReactDOM.render(
            <DetailsAssets resource={resource} />,
            document.getElementById('container')
        );

        setTimeout(() => {
            try {
                expect(mockAxios.history.get.length).toBe(0);
                expect(getAssetRows().length).toBe(0);
                expect(document.querySelector('.gn-details-assets-empty')).toBeTruthy();
            } catch (e) {
                done(e);
                return;
            }
            done();
        }, 100);
    });

    it('should filter the assets list by title', (done) => {
        const resource = { pk: 10, links: assetLinks };

        mockAxios.onGet(new RegExp(`/api/v2/resources/${resource.pk}/asset`)).reply(200, sampleAssets);

        ReactDOM.render(
            <DetailsAssets resource={resource} />,
            document.getElementById('container')
        );

        setTimeout(() => {
            Simulate.change(document.querySelector('.gn-details-assets-filter-input'), { target: { value: 'asset 2' } });
            // delay needed for InputControl
            setTimeout(() => {
                try {
                    expect(getAssetRows().length).toBe(1);
                    expect(document.querySelector('.gn-details-assets-item td:first-child a').textContent)
                        .toBe('Title of asset 2');
                } catch (e) {
                    done(e);
                    return;
                }
                done();
            }, 300);
        });
    });
});
