
/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { getUploadErrorMessageFromCode } from '../ErrorUtils';

describe('Test error utilities', () => {
    it('should test getUploadErrorMessageFromCode', () => {
        expect(getUploadErrorMessageFromCode('upload_parallelism_limit_exceeded')).toEqual('parallelLimitError');
        expect(getUploadErrorMessageFromCode('total_upload_size_exceeded')).toEqual('fileExceeds');
        expect(getUploadErrorMessageFromCode('upload_exception')).toEqual('invalidUploadMessageErrorTooltip');
        expect(getUploadErrorMessageFromCode()).toEqual('invalidUploadMessageErrorTooltip');
    });
});
