/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getCurrentProcesses, processingDownload, getCurrentResourceClonedUrl } from '../resourceservice';
import { ResourceTypes } from '@js/utils/ResourceUtils';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';


describe('resourceservice selector', () => {

    it('test getCurrentProcesses', () => {
        const testState = {
            resourceservice: {
                processes: [{ name: 'test process' }]
            }
        };
        expect(getCurrentProcesses(testState)).toEqual([{ name: 'test process' }]);
    });

    it('test processingDownload', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1
                }
            },
            resourceservice: {
                downloads: [{  pk: 1 }]
            }
        };
        expect(processingDownload(testState)).toEqual(true);
    });
    it('test processingDownload when downloding dataset in the maplayers', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1,
                    resource_type: ResourceTypes.MAP,
                    maplayers: [{dataset: {pk: 2}}]
                }
            },
            resourceservice: {
                downloads: [{  pk: 2 }]
            }
        };
        expect(processingDownload(testState)).toEqual(true);
    });

    it('test getCurrentResourceClonedUrl when completed copy process has clonedResourceUrl', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1
                }
            },
            resourceservice: {
                processes: [{
                    resource: { pk: 1 },
                    processType: ProcessTypes.COPY_RESOURCE,
                    completed: true,
                    clonedResourceUrl: 'https://example.com/resource/123'
                }]
            }
        };
        expect(getCurrentResourceClonedUrl(testState)).toEqual('https://example.com/resource/123');
    });

    it('test getCurrentResourceClonedUrl when completed copy process has no clonedResourceUrl', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1
                }
            },
            resourceservice: {
                processes: [{
                    resource: { pk: 1 },
                    processType: ProcessTypes.COPY_RESOURCE,
                    completed: true
                }]
            }
        };
        expect(getCurrentResourceClonedUrl(testState)).toEqual(null);
    });

    it('test getCurrentResourceClonedUrl when copy process is not completed', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1
                }
            },
            resourceservice: {
                processes: [{
                    resource: { pk: 1 },
                    processType: ProcessTypes.COPY_RESOURCE,
                    completed: false,
                    clonedResourceUrl: 'https://example.com/resource/123'
                }]
            }
        };
        expect(getCurrentResourceClonedUrl(testState)).toEqual(null);
    });

    it('test getCurrentResourceClonedUrl when there is no copy process', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1
                }
            },
            resourceservice: {
                processes: []
            }
        };
        expect(getCurrentResourceClonedUrl(testState)).toEqual(null);
    });

    it('test getCurrentResourceClonedUrl when there is no resource', () => {
        const testState = {
            gnresource: {
                data: null
            },
            resourceservice: {
                processes: [{
                    resource: { pk: 1 },
                    processType: ProcessTypes.COPY_RESOURCE,
                    completed: true,
                    clonedResourceUrl: 'https://example.com/resource/123'
                }]
            }
        };
        expect(getCurrentResourceClonedUrl(testState)).toEqual(null);
    });

    it('test getCurrentResourceClonedUrl when copy process is for different resource', () => {
        const testState = {
            gnresource: {
                data: {
                    pk: 1
                }
            },
            resourceservice: {
                processes: [{
                    resource: { pk: 2 },
                    processType: ProcessTypes.COPY_RESOURCE,
                    completed: true,
                    clonedResourceUrl: 'https://example.com/resource/123'
                }]
            }
        };
        expect(getCurrentResourceClonedUrl(testState)).toEqual(null);
    });
});
