/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import gnsave from '@js/reducers/gnsave';
import {
    savingResource,
    saveSuccess,
    saveError,
    clearSave,
    saveDirectContent
} from '@js/actions/gnsave';

describe('gnsave reducer', () => {
    it('should test savingResource', () => {
        const state = gnsave({}, savingResource());
        expect(state).toEqual({
            saving: true
        });
    });
    it('should test savingResource', () => {
        const state = gnsave({}, saveDirectContent());
        expect(state).toEqual({
            saving: true
        });
    });
    it('should test saveSuccess', () => {
        const success = {};
        const state = gnsave({}, saveSuccess(success));
        expect(state).toEqual({
            success,
            saving: false
        });
    });
    it('should test saveError', () => {
        const error = {};
        const state = gnsave({}, saveError(error));
        expect(state).toEqual({
            error,
            saving: false
        });
    });
    it('should test clearSave', () => {
        const state = gnsave({
            error: {},
            saving: false
        }, clearSave());
        expect(state).toEqual({});
    });
});
