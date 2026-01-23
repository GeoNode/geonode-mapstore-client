
/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getUploadErrorMessageFromCode, getProcessErrorInfo } from '../ErrorUtils';
import { ProcessTypes } from '../ResourceServiceUtils';

describe('Test error utilities', () => {
    it('should test getUploadErrorMessageFromCode', () => {
        expect(getUploadErrorMessageFromCode('upload_parallelism_limit_exceeded')).toEqual('parallelLimitError');
        expect(getUploadErrorMessageFromCode('total_upload_size_exceeded')).toEqual('fileExceeds');
        expect(getUploadErrorMessageFromCode('upload_exception')).toEqual('invalidUploadMessageErrorTooltip');
        expect(getUploadErrorMessageFromCode()).toEqual('invalidUploadMessageErrorTooltip');
    });

    describe('getProcessErrorInfo', () => {
        it('should extract error message with priority: log > output.error > process.error > default', () => {
            // Test log priority
            const processWithLog = {
                output: { log: 'ErrorDetailstring=Log error' }
            };
            expect(getProcessErrorInfo(processWithLog).message).toContain('Log error');

            // Test output.error priority
            const processWithOutputError = {
                error: 'Process error',
                output: { error: 'Output error' }
            };
            expect(getProcessErrorInfo(processWithOutputError).message).toBe('Output error');

            // Test process.error fallback
            const processWithError = {
                error: 'Process error'
            };
            expect(getProcessErrorInfo(processWithError).message).toBe('Process error');

            // Test default message
            expect(getProcessErrorInfo({}).message).toBe('map.mapError.errorDefault');
            expect(getProcessErrorInfo({}, { defaultMessage: 'Custom' }).message).toBe('Custom');
        });

        it('should determine title based on process type', () => {
            // Copy process types
            expect(getProcessErrorInfo({ processType: ProcessTypes.COPY_RESOURCE }).title).toBe('gnviewer.errorCloningTitle');
            expect(getProcessErrorInfo({ processType: 'copy' }).title).toBe('gnviewer.errorCloningTitle');
            expect(getProcessErrorInfo({ processType: 'copy_geonode_resource' }).title).toBe('gnviewer.errorCloningTitle');

            // Delete process types
            expect(getProcessErrorInfo({ processType: ProcessTypes.DELETE_RESOURCE }).title).toBe('gnviewer.errorDeletingTitle');
            expect(getProcessErrorInfo({ processType: 'delete' }).title).toBe('gnviewer.errorDeletingTitle');

            // Other/unknown process types
            expect(getProcessErrorInfo({ processType: 'unknown' }).title).toBe('gnviewer.errorOperationTitle');
            expect(getProcessErrorInfo({}).title).toBe('gnviewer.errorOperationTitle');
        });

        it('should use custom default title when provided', () => {
            const process = {
                processType: ProcessTypes.COPY_RESOURCE,
                output: { error: 'Error' }
            };
            const result = getProcessErrorInfo(process, { defaultTitle: 'custom.title' });
            expect(result.title).toBe('custom.title');
            expect(result.message).toBe('Error');
        });

        it('should handle complete flow with error extraction and title determination', () => {
            const process = {
                processType: ProcessTypes.DELETE_RESOURCE,
                output: {
                    log: 'ErrorDetailstring=Delete failed'
                }
            };
            const result = getProcessErrorInfo(process);
            expect(result.title).toBe('gnviewer.errorDeletingTitle');
            expect(result.message).toContain('Delete failed');
        });
    });
});
