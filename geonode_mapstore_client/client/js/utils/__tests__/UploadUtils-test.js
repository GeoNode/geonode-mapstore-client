
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
    getSupportedTypeExt,
    parseFileResourceUploads,
    validateFileResourceUploads,
    validateRemoteResourceUploads,
    getUploadMainFile,
    getUploadFileName,
    getUploadProperty,
    getSize,
    getExceedingFileSize,
    isCOGFileUrl
} from '../UploadUtils';

const supportedFiles = [
    {
        id: "shp",
        label: "ESRI Shapefile",
        required_ext: ['shp', 'prj', 'dbf', 'shx'],
        optional_ext: ['xml', 'sld', 'cpg', 'cst'],
        source: ['upload'],
        format: 'vector'
    },
    {
        id: 'csv',
        label: 'CSV',
        required_ext: ['csv'],
        optional_ext: ['sld', 'xml'],
        source: ['upload'],
        format: 'vector'
    },
    {
        id: 'gpkg',
        label: 'GeoPackage',
        required_ext: ['gpkg'],
        source: ['upload'],
        format: 'vector'
    }
];

describe('Test Upload Utils', () => {
    it('isCOGFileUrl', () => {
        expect(isCOGFileUrl()).toBe(false);
        expect(isCOGFileUrl('http://example.com/data.tif')).toBe(true);
        expect(isCOGFileUrl('http://example.com/data.tiff')).toBe(true);
        expect(isCOGFileUrl('http://example.com/DATA.TIF')).toBe(true);
        expect(isCOGFileUrl('http://example.com/data.png')).toBe(false);
    });
    it('hasExtensionInUrl', () => {
        expect(hasExtensionInUrl()).toBe(false);
        expect(hasExtensionInUrl({ url: 'http://path/filename.png' })).toBe(true);
        expect(hasExtensionInUrl({ url: 'http://path/filename' })).toBe(false);
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
                isRemoteTypeSupported: false
            }
        })).toBe('gnviewer.invalidUrl');
        expect(getErrorMessageId({
            validation: {
                isRemoteUrlDuplicated: true,
                isValidRemoteUrl: true,
                isRemoteTypeSupported: false
            }
        }, { remoteTypeErrorMessageId: 'errorMsgId' })).toBe('errorMsgId');
        expect(getErrorMessageId({
            validation: {
                isRemoteUrlDuplicated: true,
                isValidRemoteUrl: true,
                isRemoteTypeSupported: true
            }
        })).toBe('gnviewer.duplicateUrl');
    });
    it('getSupportedTypeExt', () => {
        expect(getSupportedTypeExt()).toEqual([]);
        expect(getSupportedTypeExt(supportedFiles[0])).toEqual(["shp", "prj", "dbf", "shx", "xml", "sld", "cpg", "cst"]);
        expect(getSupportedTypeExt(supportedFiles[2])).toEqual(["gpkg"]);
    });
    it('parseFileResourceUploads', () => {
        expect(parseFileResourceUploads()).toEqual([]);
        expect(parseFileResourceUploads([],
            [{ id: 'f-1', type: 'file', baseName: 'filename', ext: 'txt', file: { name: 'filename.txt' } }],
            { supportedFiles }))
            .toEqual([{
                id: 'f-1',
                baseName: 'filename',
                type: 'file',
                files: { txt: { name: 'filename.txt' } },
                ext: [ 'txt' ],
                supported: false
            }]);

        const sldFile = parseFileResourceUploads([],
            [{ id: 'f-1', type: 'file', baseName: 'filename', ext: 'sld', file: { name: 'filename.sld' } }],
            { supportedFiles })[0];
        expect(sldFile).toEqual({
            id: 'f-1',
            baseName: 'filename',
            type: 'file',
            files: { sld: { name: 'filename.sld' } },
            ext: [ 'sld' ],
            supported: true
        });

        expect(parseFileResourceUploads(
            [sldFile],
            [{ id: 'f-2', type: 'file', baseName: 'filename', ext: 'csv', file: { name: 'filename.csv' } }],
            { supportedFiles }))
            .toEqual([{
                id: 'f-1',
                baseName: 'filename',
                type: 'file',
                files: {
                    sld: { name: 'filename.sld' },
                    csv: { name: 'filename.csv' }
                },
                ext: [ 'sld', 'csv' ],
                supported: true
            }]);

        expect(parseFileResourceUploads(
            [sldFile],
            [{ id: 'f-2', type: 'file', baseName: 'filename', ext: 'shp', file: { name: 'filename.shp' } }],
            { supportedFiles }))
            .toEqual([{
                id: 'f-1',
                baseName: 'filename',
                type: 'file',
                files: {
                    sld: { name: 'filename.sld' },
                    shp: { name: 'filename.shp' }
                },
                ext: [ 'sld', 'shp' ],
                supported: true
            }]);

        expect(parseFileResourceUploads(
            [sldFile],
            [{ id: 'f-2', type: 'file', baseName: 'filename', ext: 'gpkg', file: { name: 'filename.gpkg' } }],
            { supportedFiles }))
            .toEqual([{
                id: 'f-1',
                baseName: 'filename',
                type: 'file',
                files: {
                    sld: { name: 'filename.sld' }
                },
                ext: [ 'sld' ],
                supported: true
            }, {
                id: 'f-2',
                baseName: 'filename',
                type: 'file',
                files: {
                    gpkg: { name: 'filename.gpkg' }
                },
                ext: [ 'gpkg' ],
                supported: true
            }]);

    });
    it('validateFileResourceUploads', () => {
        expect(validateFileResourceUploads()).toEqual([]);
        expect(validateFileResourceUploads([
            { type: 'remote', url: '' },
            { type: 'file', supported: false }
        ], { supportedFiles })).toEqual([
            { type: 'remote', url: '' },
            { type: 'file', supported: false }
        ]);
        expect(validateFileResourceUploads([
            { type: 'file', supported: true, ext: ['txt'] }
        ], { supportedFiles })).toEqual([
            { type: 'file', supported: false, ext: ['txt'] }
        ]);
        expect(validateFileResourceUploads([
            { type: 'file', ext: ['sld'], files: { sld: { } }, supported: true }
        ], { supportedFiles })).toEqual([
            {
                type: 'file',
                ext: [ 'sld' ],
                files: { sld: {} },
                supported: true,
                ready: false,
                missingExtensions: [ '*' ]
            }
        ]);
        expect(validateFileResourceUploads([
            { type: 'file', ext: ['shp'], files: { shp: { } }, supported: true }
        ], { supportedFiles })).toEqual([
            {
                type: 'file',
                ext: [ 'shp' ],
                files: { shp: {} },
                supported: true,
                ready: false,
                missingExtensions: ['prj', 'dbf', 'shx']
            }
        ]);
        expect(validateFileResourceUploads([
            { type: 'file', ext: ['csv'], files: { csv: { } }, supported: true }
        ], { supportedFiles })).toEqual([
            {
                type: 'file',
                ext: [ 'csv' ],
                files: { csv: {} },
                supported: true,
                ready: true,
                missingExtensions: []
            }
        ]);
    });
    it('validateRemoteResourceUploads sets COG type for tif/tiff URLs', () => {
        const uploads = [
            { url: 'http://example.com/data.tif', remoteType: '', type: 'remote' },
            { url: 'http://example.com/data.TIFF', remoteType: 'wms', type: 'remote' }
        ];
        const remoteTypes = [{ value: 'cog' }];
        const [first, second] = validateRemoteResourceUploads(uploads, { remoteTypes });

        expect(first.remoteType).toBe('cog');
        expect(first.supported).toBe(true);
        expect(first.ready).toBe(true);

        expect(second.remoteType).toBe('cog');
        expect(second.supported).toBe(true);
        expect(second.ready).toBe(true);
    });
    it('validateRemoteResourceUploads', () => {
        expect(validateRemoteResourceUploads()).toEqual([]);
        expect(validateRemoteResourceUploads([
            { url: '', remoteType: '', type: 'remote' }
        ], {})).toEqual([
            {
                url: '',
                remoteType: '',
                supported: false,
                ready: false,
                type: 'remote',
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: false,
                    isRemoteTypeSupported: true
                }
            }
        ]);

        expect(validateRemoteResourceUploads([
            { url: '/path/to/remote', remoteType: '', type: 'remote' }
        ], {})).toEqual([
            {
                url: '/path/to/remote',
                remoteType: '',
                supported: false,
                ready: false,
                type: 'remote',
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: false,
                    isRemoteTypeSupported: true
                }
            }
        ]);

        expect(validateRemoteResourceUploads([
            { url: 'http://path/to/remote', remoteType: '', type: 'remote' }
        ], { remoteTypes: [{ value: '.png' }] })).toEqual([
            {
                url: 'http://path/to/remote',
                remoteType: '',
                supported: false,
                ready: false,
                type: 'remote',
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: true,
                    isRemoteTypeSupported: false
                }
            }
        ]);

        expect(validateRemoteResourceUploads([
            { url: 'http://path/to/remote', remoteType: '3dtiles', type: 'remote' }
        ], { remoteTypes: [{ value: '3dtiles' }] })).toEqual([
            {
                url: 'http://path/to/remote',
                remoteType: '3dtiles',
                supported: true,
                ready: true,
                type: 'remote',
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: true,
                    isRemoteTypeSupported: true
                }
            }
        ]);

        expect(validateRemoteResourceUploads([
            { url: 'http://path/to/remote', remoteType: '', type: 'remote' },
            { url: 'http://path/to/remote', remoteType: '', type: 'remote' }
        ], {})).toEqual([
            {
                url: 'http://path/to/remote',
                remoteType: '',
                supported: true,
                ready: true,
                type: 'remote',
                validation: {
                    isRemoteUrlDuplicated: false,
                    isValidRemoteUrl: true,
                    isRemoteTypeSupported: true
                }
            },
            {
                url: 'http://path/to/remote',
                remoteType: '',
                supported: false,
                ready: false,
                type: 'remote',
                validation: {
                    isRemoteUrlDuplicated: true,
                    isValidRemoteUrl: true,
                    isRemoteTypeSupported: true
                }
            }
        ]);
    });
    it('getUploadMainFile', () => {
        expect(getUploadMainFile()).toBe(undefined);
        expect(getUploadMainFile({ upload: { ext: ['csv'], files: { csv: { name: 'file.csv' } } } })).toEqual({ name: 'file.csv' });
    });
    it('getUploadFileName', () => {
        expect(getUploadFileName()).toBe(undefined);
        expect(getUploadFileName({ upload: { type: 'file', ext: ['csv'], files: { csv: { name: 'file.csv' } } } })).toBe('file.csv');
        expect(getUploadFileName({ upload: { type: 'remote', url: 'http://path/to/file.csv' } })).toBe('file');
    });
    it('getUploadProperty', () => {
        expect(getUploadProperty()()).toBe(undefined);
        expect(getUploadProperty('url')({ upload: { type: 'remote', url: 'http://path/to/file.csv' } })).toBe('http://path/to/file.csv');
    });
    it('getSize', () => {
        expect(getSize()).toBe(0);
        expect(Math.round(getSize({ csv: { size: 1000000 } }))).toBe(1);
        expect(getSize({ csv: { size: 1000000 } }, true)).toBe('1 MB');
        expect(getSize({ csv: { size: 500000 } }, true)).toBe('489 KB');
    });
    it('getExceedingFileSize', () => {
        expect(getExceedingFileSize([
            { type: 'file', files: { csv: { size: 500000 } } },
            { type: 'file', files: { csv: { size: 2000000 } } }
        ], 1)).toBe(true);
        expect(getExceedingFileSize([
            { type: 'file', files: { csv: { size: 500000 } } },
            { type: 'file', files: { csv: { size: 700000 } } }
        ], 1)).toBe(false);
    });
});
