
/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    hasExtensionInUrl,
    isNotSupported,
    getErrorMessageId,
    validateRemoteResourceUploads
} from '../UploadUtils';

describe('Test Upload Utils', () => {
    it('hasExtensionInUrl', () => {
        expect(hasExtensionInUrl()).toBe(false);
        expect(hasExtensionInUrl({ remoteUrl: 'http://path/filename.png' })).toBe(true);
        expect(hasExtensionInUrl({ remoteUrl: 'http://path/filename' })).toBe(false);
    });
    it('isNotSupported', () => {
        expect(isNotSupported()).toBe(false);
        expect(isNotSupported({ supported: true })).toBe(false);
        expect(isNotSupported({ supported: false })).toBe(true);
    });
    it('getErrorMessageId', () => {
        expect(getErrorMessageId()).toBe('gnviewer.invalidUrl');
        expect(getErrorMessageId({
            validation: {
                isRemoteUrlDuplicated: true,
                isValidRemoteUrl: false,
                isExtensionSupported: false,
                isServiceTypeSupported: false
            }
        })).toBe('gnviewer.invalidUrl');
        expect(getErrorMessageId({
            validation: {
                isRemoteUrlDuplicated: true,
                isValidRemoteUrl: true,
                isExtensionSupported: false,
                isServiceTypeSupported: false
            }
        })).toBe('gnviewer.unsupportedUrlExtension');
        expect(getErrorMessageId({
            validation: {
                isRemoteUrlDuplicated: true,
                isValidRemoteUrl: true,
                isExtensionSupported: true,
                isServiceTypeSupported: false
            }
        })).toBe('gnviewer.unsupportedUrlServiceType');
        expect(getErrorMessageId({
            validation: {
                isRemoteUrlDuplicated: true,
                isValidRemoteUrl: true,
                isExtensionSupported: true,
                isServiceTypeSupported: true
            }
        })).toBe('gnviewer.duplicateUrl');
    });
    it('validateRemoteResourceUploads', () => {
        expect(validateRemoteResourceUploads()).toEqual([]);
        expect(validateRemoteResourceUploads([
            { remoteUrl: '', extension: '', serviceType: '' }
        ], {})).toEqual([
            {
                remoteUrl: '',
                extension: '',
                serviceType: '',
                supported: false,
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: false,
                    isExtensionSupported: true,
                    isServiceTypeSupported: true
                }
            }
        ]);
        expect(validateRemoteResourceUploads([
            { remoteUrl: '/path/to/remote', extension: '', serviceType: '' }
        ], {})).toEqual([
            {
                remoteUrl: '/path/to/remote',
                extension: '',
                serviceType: '',
                supported: false,
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: false,
                    isExtensionSupported: true,
                    isServiceTypeSupported: true
                }
            }
        ]);
        expect(validateRemoteResourceUploads([
            { remoteUrl: 'http://path/to/remote', extension: '', serviceType: '' }
        ], { extensions: [{ value: '.png' }], serviceTypes: [{ value: '3dtiles' }] })).toEqual([
            {
                remoteUrl: 'http://path/to/remote',
                extension: '',
                serviceType: '',
                supported: false,
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: true,
                    isExtensionSupported: false,
                    isServiceTypeSupported: false
                }
            }
        ]);
        expect(validateRemoteResourceUploads([
            { remoteUrl: 'http://path/to/remote', extension: '', serviceType: '3dtiles' }
        ], { serviceTypes: [{ value: '3dtiles' }] })).toEqual([
            {
                remoteUrl: 'http://path/to/remote',
                extension: '',
                serviceType: '3dtiles',
                supported: true,
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: true,
                    isExtensionSupported: true,
                    isServiceTypeSupported: true
                }
            }
        ]);
        expect(validateRemoteResourceUploads([
            { remoteUrl: 'http://path/to/remote.png', extension: '.png', serviceType: '' }
        ], { extensions: [{ value: '.png' }] })).toEqual([
            {
                remoteUrl: 'http://path/to/remote.png',
                extension: '.png',
                serviceType: '',
                supported: true,
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: true,
                    isExtensionSupported: true,
                    isServiceTypeSupported: true
                }
            }
        ]);
        expect(validateRemoteResourceUploads([
            { remoteUrl: 'http://path/to/remote', extension: '', serviceType: '' },
            { remoteUrl: 'http://path/to/remote', extension: '', serviceType: '' }
        ], {})).toEqual([
            {
                remoteUrl: 'http://path/to/remote',
                extension: '',
                serviceType: '',
                supported: true,
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: true,
                    isExtensionSupported: true,
                    isServiceTypeSupported: true
                }
            },
            {
                remoteUrl: 'http://path/to/remote',
                extension: '',
                serviceType: '',
                supported: false,
                validation: {
                    isRemoteUrlDuplicated: true,
                    isValidRemoteUrl: true,
                    isExtensionSupported: true,
                    isServiceTypeSupported: true
                }
            }
        ]);
    });
});
