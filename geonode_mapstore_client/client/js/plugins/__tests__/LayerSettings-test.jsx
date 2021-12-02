/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import React from 'react';
import trim from 'lodash/trim';
import ReactDOM from 'react-dom';
import { getPluginForTest } from '@mapstore/framework/plugins/__tests__/pluginsTestUtils';
import LayerSettings from '../LayerSettings';

describe('LayerSettings Plugin', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        window.__DEVTOOLS__ = true;
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        window.__DEVTOOLS__ = undefined;
        setTimeout(done);
    });

    it('should render the base layer settings', () => {
        const state = {
            layers: {
                flat: [
                    {
                        name: 'test',
                        id: 'layer1',
                        title: 'test layer',
                        type: 'wms',
                        url: 'https://gs-stable.geo-solutions.it/geoserver/wms'
                    },
                    {
                        id: 'layer2',
                        type: 'vector',
                        features: []
                    }
                ],
                groups: [
                    {
                        expanded: true,
                        id: 'Default',
                        name: 'Default',
                        nodes: ['layer1', 'layer2'],
                        title: 'Default'
                    }
                ],
                selected: ['layer2'],
                settings: {
                    expanded: true,
                    node: 'layer2',
                    nodeType: 'layers'
                }
            }
        };
        const { Plugin } = getPluginForTest(LayerSettings, state);
        ReactDOM.render(<Plugin />, document.getElementById('container'));
        const sections = document.querySelectorAll('.gn-layer-settings-section-title');
        expect(sections.length).toBe(2);
        expect([...sections].map(section => trim(section.innerText))).toEqual([
            'gnviewer.generalSettings',
            'gnviewer.visibilitySettings'
        ]);
    });
    it('should render the wms layer settings', () => {
        const state = {
            layers: {
                flat: [
                    {
                        name: 'test',
                        id: 'layer1',
                        title: 'test layer',
                        type: 'wms',
                        url: 'https://gs-stable.geo-solutions.it/geoserver/wms'
                    },
                    {
                        id: 'layer2',
                        type: 'vector',
                        features: []
                    }
                ],
                groups: [
                    {
                        expanded: true,
                        id: 'Default',
                        name: 'Default',
                        nodes: ['layer1', 'layer2'],
                        title: 'Default'
                    }
                ],
                selected: ['layer1'],
                settings: {
                    expanded: true,
                    node: 'layer1',
                    nodeType: 'layers'
                }
            }
        };
        const { Plugin } = getPluginForTest(LayerSettings, state);
        ReactDOM.render(<Plugin />, document.getElementById('container'));
        const sections = document.querySelectorAll('.gn-layer-settings-section-title');
        expect(sections.length).toBe(4);
        expect([...sections].map(section => trim(section.innerText))).toEqual([
            'gnviewer.generalSettings',
            'gnviewer.visibilitySettings',
            'gnviewer.styleSettings',
            'gnviewer.tilingSettings'
        ]);
    });
    it('should render the group settings', () => {
        const state = {
            layers: {
                flat: [
                    {
                        name: 'test',
                        id: 'layer1',
                        title: 'test layer',
                        type: 'wms',
                        url: 'https://gs-stable.geo-solutions.it/geoserver/wms'
                    },
                    {
                        id: 'layer2',
                        type: 'vector',
                        features: []
                    }
                ],
                groups: [
                    {
                        expanded: true,
                        id: 'Default',
                        name: 'Default',
                        nodes: ['layer1', 'layer2'],
                        title: 'Default'
                    }
                ],
                selected: ['Default'],
                settings: {
                    expanded: true,
                    node: 'Default',
                    nodeType: 'groups'
                }
            }
        };
        const { Plugin } = getPluginForTest(LayerSettings, state);
        ReactDOM.render(<Plugin />, document.getElementById('container'));
        const sections = document.querySelectorAll('.gn-layer-settings-section-title');
        expect(sections.length).toBe(1);
        expect([...sections].map(section => trim(section.innerText))).toEqual([
            'gnviewer.generalSettings'
        ]);
    });
});
