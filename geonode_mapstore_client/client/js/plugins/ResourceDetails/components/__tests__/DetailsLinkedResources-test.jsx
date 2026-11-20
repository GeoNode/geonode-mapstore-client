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

import DetailsLinkedResources from '../DetailsLinkedResources';

const linkedResource = (pk, resourceType, options) => ({
    pk,
    title: `${resourceType} ${pk}`,
    resource_type: resourceType,
    detail_url: `/catalogue/#/${resourceType}/${pk}`,
    ...options
});

// without the intl context the message id is rendered as the group title
const getGroups = () => [...document.querySelectorAll('.gn-details-relations > *')].map((group) => ({
    type: group.firstChild.textContent.replace('gnviewer.linkedResources.', ''),
    titles: [...group.querySelectorAll('a')].map((link) => link.textContent)
}));

describe('DetailsLinkedResources component', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById('container'));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('should render nothing without linked resources', () => {
        ReactDOM.render(<DetailsLinkedResources />, document.getElementById('container'));
        expect(document.querySelector('.gn-details-relations')).toBeTruthy();
        expect(getGroups()).toEqual([]);
    });

    it('should group the linked resources by relation type', () => {
        const fields = {
            linkedTo: [
                linkedResource(1, 'document', { relation_type: 'related', internal: false }),
                linkedResource(2, 'dataset', { relation_type: 'uses', internal: true }),
                linkedResource(3, 'map', { relation_type: 'clone_of', internal: false })
            ],
            linkedBy: [
                linkedResource(4, 'map', { relation_type: 'clone_of', internal: false }),
                linkedResource(5, 'document', { relation_type: 'related', internal: false })
            ]
        };
        ReactDOM.render(<DetailsLinkedResources fields={fields} />, document.getElementById('container'));
        expect(getGroups()).toEqual([
            { type: 'linkedTo', titles: ['document 1'] },
            { type: 'linkedBy', titles: ['document 5'] },
            { type: 'uses', titles: ['dataset 2'] },
            { type: 'cloneOf', titles: ['map 3'] },
            { type: 'clonedBy', titles: ['map 4'] }
        ]);
    });

    it('should use the internal flag when the relation type is missing', () => {
        const fields = {
            linkedTo: [
                linkedResource(1, 'document', { internal: false }),
                linkedResource(2, 'dataset', { internal: true })
            ],
            linkedBy: [
                linkedResource(3, 'map', { internal: true })
            ]
        };
        ReactDOM.render(<DetailsLinkedResources fields={fields} />, document.getElementById('container'));
        expect(getGroups()).toEqual([
            { type: 'linkedTo', titles: ['document 1'] },
            { type: 'uses', titles: ['dataset 2'] },
            { type: 'usedBy', titles: ['map 3'] }
        ]);
    });

    it('should list unknown relation types with the generic links', () => {
        const fields = {
            linkedTo: [
                linkedResource(1, 'document', { relation_type: 'unknown', internal: false })
            ]
        };
        ReactDOM.render(<DetailsLinkedResources fields={fields} />, document.getElementById('container'));
        expect(getGroups()).toEqual([
            { type: 'linkedTo', titles: ['document 1'] }
        ]);
    });
});
