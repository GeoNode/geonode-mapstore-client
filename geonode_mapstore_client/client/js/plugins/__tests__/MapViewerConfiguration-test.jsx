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
import { RemoveMapViewerButton } from '../MapViewerConfiguration';

describe('MapViewerConfiguration RemoveMapViewerButton', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should allow delete when viewer is associated with a single map and has clones', (done) => {
        const viewerLinkedResource = {
            pk: 1,
            title: 'Viewer 1',
            linkedResources: {
                linkedBy: [
                    { pk: 2, resource_type: 'map', relation_type: 'related' },
                    { pk: 3, resource_type: 'mapviewer', relation_type: 'clone_of' },
                    { pk: 4, resource_type: 'mapviewer', relation_type: 'clone_of' }
                ]
            }
        };

        const onDelete = ({ resources, resourceType }) => {
            expect(resources[0].pk).toBe(1);
            expect(resourceType).toBe('mapviewer');
            done();
        };

        ReactDOM.render(
            <RemoveMapViewerButton
                viewerLinkedResource={viewerLinkedResource}
                resource={{ pk: 2 }}
                onDelete={onDelete}
                onRemove={() => {}}
            />,
            document.getElementById('container')
        );

        const button = document.querySelector('button');
        expect(button).toBeTruthy();
        button.click();
    });

    it('should unlink instead of delete when viewer is associated with multiple maps regardless of clones', (done) => {
        const viewerLinkedResource = {
            pk: 1,
            title: 'Viewer 1',
            linkedResources: {
                linkedBy: [
                    { pk: 2, resource_type: 'map', relation_type: 'related' },
                    { pk: 5, resource_type: 'map', relation_type: 'related' },
                    { pk: 3, resource_type: 'mapviewer', relation_type: 'clone_of' }
                ]
            }
        };

        const onRemove = ({ source, target, resourceType }) => {
            expect(source).toBe(2);
            expect(target).toBe(1);
            expect(resourceType).toBe('mapviewer');
            done();
        };

        ReactDOM.render(
            <RemoveMapViewerButton
                viewerLinkedResource={viewerLinkedResource}
                resource={{ pk: 2 }}
                onDelete={() => {}}
                onRemove={onRemove}
            />,
            document.getElementById('container')
        );

        const button = document.querySelector('button');
        expect(button).toBeTruthy();
        button.click();
    });

    it('should support older backend without relation_type falling back to internal', (done) => {
        const viewerLinkedResource = {
            pk: 1,
            title: 'Viewer 1',
            linkedResources: {
                linkedBy: [
                    { pk: 2, resource_type: 'map', internal: false },
                    { pk: 3, resource_type: 'dataset', internal: true }
                ]
            }
        };

        const onDelete = ({ resources, resourceType }) => {
            expect(resources[0].pk).toBe(1);
            expect(resourceType).toBe('mapviewer');
            done();
        };

        ReactDOM.render(
            <RemoveMapViewerButton
                viewerLinkedResource={viewerLinkedResource}
                resource={{ pk: 2 }}
                onDelete={onDelete}
                onRemove={() => {}}
            />,
            document.getElementById('container')
        );

        const button = document.querySelector('button');
        expect(button).toBeTruthy();
        button.click();
    });
});
