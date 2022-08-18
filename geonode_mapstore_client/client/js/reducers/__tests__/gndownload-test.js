/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import gndownload from '@js/reducers/gndownload';
import {
    downloadMetaData,
    downloadMetaDataComplete
} from '@js/actions/gndownload';

describe('gndownload reducer', () => {
    it('should test downloadMetaData', () => {
        const state = gndownload({downloads: {ISO: {}, DublinCore: {}}}, downloadMetaData('ISO', 1));
        expect(state).toEqual({
            downloads: {
                DublinCore: {},
                ISO: {
                    1: true
                }
            }
        });
    });
    it('should test downloadMetaDataComplete', () => {
        const state = gndownload({downloads: {ISO: {}, DublinCore: {}}}, downloadMetaDataComplete('ISO', 1));
        expect(state).toEqual({
            downloads: {
                DublinCore: {},
                ISO: {}
            }
        });
    });
});
