/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import expect from 'expect';
import { getSearchResults, getFeaturedResults, getTotalResources } from '../search';

describe('Search selectors tests', () => {

    it('should getSearchResults', () => {
        const testState = {
            resourceservice: {
                processes: [{ resource: { pk: 1 }, processType: 'deleteResource', output: { status: 'finished' }, completed: true }]
            },
            gnsearch: {
                resources: [{ pk: 1, processed: true }, { pk: 2 }]
            }
        };
        expect(getSearchResults(testState)).toEqual([{ pk: 2 }]);
    });

    it('should getFeaturedResults', () => {
        const testState = {
            resourceservice: {
                processes: [{ resource: { pk: 1 }, processType: 'deleteResource', output: { status: 'finished' }, completed: true }]
            },
            gnsearch: {
                featuredResources: {
                    resources: [{ pk: 1, processed: true }, { pk: 2 }]
                }
            }
        };
        expect(getFeaturedResults(testState)).toEqual([{ pk: 2 }]);
    });

    it('should getTotalResources', () => {
        const testState = {
            resourceservice: {
                processes: [{ resource: { pk: 1 }, processType: 'deleteResource', output: { status: 'finished' }, completed: true }]
            },
            gnsearch: {
                resources: [
                    { pk: 1, processed: true }, { pk: 2 }, {
                        pk: 3, '@temporary': true
                    }],
                total: 1
            }
        };
        expect(getTotalResources(testState)).toEqual(2);
    });
});
