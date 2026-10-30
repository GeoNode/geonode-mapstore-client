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

import DetailsToolbar from '../DetailsToolbar';

describe('DetailsToolbar component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render DetailsToolbar with default props and share button', () => {
        ReactDOM.render(
            <DetailsToolbar />,
            document.getElementById('container')
        );

        const shareGlyph = document.querySelector('.glyphicon-share-alt');
        expect(shareGlyph).toBeTruthy();
    });

    it('should trigger onToggleShare when clicking the share button', () => {
        let sharePayload = null;

        const resource = {
            pk: 123,
            uuid: 'test-uuid-123',
            category: { name: 'Vector' }
        };

        ReactDOM.render(
            <DetailsToolbar
                resource={resource}
                onToggleShare={(payload) => {
                    sharePayload = payload;
                }}
            />,
            document.getElementById('container')
        );

        const shareGlyph = document.querySelector('.glyphicon-share-alt');
        expect(shareGlyph).toBeTruthy();

        const shareButton = shareGlyph.closest('button');
        expect(shareButton).toBeTruthy();

        Simulate.click(shareButton);

        expect(sharePayload).toBeTruthy();
        expect(sharePayload.shareUrl).toContain('/catalogue/uuid/test-uuid-123');
        expect(sharePayload.categoryName).toBe('vector');
    });

    it('should handle resource without category when clicking share button', () => {
        let sharePayload = null;

        const resource = {
            pk: 456,
            uuid: 'test-uuid-456'
        };

        ReactDOM.render(
            <DetailsToolbar
                resource={resource}
                onToggleShare={(payload) => {
                    sharePayload = payload;
                }}
            />,
            document.getElementById('container')
        );

        const shareGlyph = document.querySelector('.glyphicon-share-alt');
        const shareButton = shareGlyph.closest('button');
        Simulate.click(shareButton);

        expect(sharePayload).toBeTruthy();
        expect(sharePayload.shareUrl).toContain('/catalogue/uuid/test-uuid-456');
        expect(sharePayload.categoryName).toBe('');
    });

    it('should render custom toolbar items', () => {
        const CustomItem = ({ resource }) => (
            <div className="custom-toolbar-item">{resource?.title}</div>
        );

        const resource = { title: 'Test Resource' };
        const items = [
            { name: 'customItem', Component: CustomItem }
        ];

        ReactDOM.render(
            <DetailsToolbar
                resource={resource}
                items={items}
            />,
            document.getElementById('container')
        );

        const customElem = document.querySelector('.custom-toolbar-item');
        expect(customElem).toBeTruthy();
        expect(customElem.textContent).toBe('Test Resource');
    });

    it('should render copy dataset ows url button when dataset_ows_url is provided', () => {
        const resource = {
            dataset_ows_url: 'https://example.com/geoserver/ows'
        };

        ReactDOM.render(
            <DetailsToolbar
                resource={resource}
            />,
            document.getElementById('container')
        );

        const globeGlyph = document.querySelector('.glyphicon-globe');
        expect(globeGlyph).toBeTruthy();

        const copyButton = globeGlyph.closest('button');
        expect(copyButton).toBeTruthy();
        Simulate.click(copyButton);
    });

    it('should render viewer button when showViewerButton is true and viewerUrl exists', () => {
        const resource = {
            '@extras': {
                info: {
                    viewerUrl: '/catalogue/#/map/1',
                    typeName: 'Map'
                }
            }
        };

        ReactDOM.render(
            <DetailsToolbar
                resource={resource}
                showViewerButton
            />,
            document.getElementById('container')
        );

        const linkButton = document.querySelector('a.btn-primary');
        expect(linkButton).toBeTruthy();
        expect(linkButton.getAttribute('href')).toBe('/catalogue/#/map/1');
    });

    it('should render metadata detail button when showViewerButton is true and only metadataDetailUrl exists', () => {
        const resource = {
            '@extras': {
                info: {
                    metadataDetailUrl: '/catalogue/#/dataset/1/metadata'
                }
            }
        };

        ReactDOM.render(
            <DetailsToolbar
                resource={resource}
                showViewerButton
            />,
            document.getElementById('container')
        );

        const linkButton = document.querySelector('a.btn-primary');
        expect(linkButton).toBeTruthy();
        expect(linkButton.getAttribute('href')).toBe('/catalogue/#/dataset/1/metadata');
    });

    it('should not render viewer button when showViewerButton is false', () => {
        const resource = {
            '@extras': {
                info: {
                    viewerUrl: '/catalogue/#/map/1',
                    typeName: 'Map'
                }
            }
        };

        ReactDOM.render(
            <DetailsToolbar
                resource={resource}
                showViewerButton={false}
            />,
            document.getElementById('container')
        );

        const linkButton = document.querySelector('a.btn-primary');
        expect(linkButton).toBeFalsy();
    });
});
