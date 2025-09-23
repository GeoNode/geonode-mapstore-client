/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    validateAttributes,
    getErrorByPath,
    RestrictionsTypes
} from '../CreateDatasetUtils';

describe('Test CreateDatasetUtils', () => {
    describe('validateAttributes', () => {
        it('should return empty array for invalid data', () => {
            expect(validateAttributes()).toEqual([]);
            expect(validateAttributes({})).toEqual([]);
            expect(validateAttributes({ attributes: null })).toEqual([]);
            expect(validateAttributes({ attributes: undefined })).toEqual([]);
            expect(validateAttributes({ attributes: 'not-array' })).toEqual([]);
        });

        it('should return empty array for empty attributes array', () => {
            expect(validateAttributes({ attributes: [] })).toEqual([]);
        });

        it('should validate unique attribute names', () => {
            const data = {
                attributes: [
                    { name: 'attr1', type: 'string' },
                    { name: 'attr2', type: 'string' },
                    { name: 'attr1', type: 'integer' } // duplicate name
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(2);
            expect(errors[0]).toEqual({
                instancePath: '/attributes/0/name',
                message: 'gnviewer.duplicateAttributeNameError'
            });
            expect(errors[1]).toEqual({
                instancePath: '/attributes/2/name',
                message: 'gnviewer.duplicateAttributeNameError'
            });
        });

        it('should handle multiple duplicate names', () => {
            const data = {
                attributes: [
                    { name: 'attr1', type: 'string' },
                    { name: 'attr1', type: 'integer' },
                    { name: 'attr1', type: 'float' },
                    { name: 'attr2', type: 'string' }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(3);
            expect(errors.every(error => error.message === 'gnviewer.duplicateAttributeNameError')).toBe(true);
            expect(errors[0].instancePath).toBe('/attributes/0/name');
            expect(errors[1].instancePath).toBe('/attributes/1/name');
            expect(errors[2].instancePath).toBe('/attributes/2/name');
        });

        it('should handle empty and whitespace-only names', () => {
            const data = {
                attributes: [
                    { name: '', type: 'string' },
                    { name: '   ', type: 'string' },
                    { name: 'valid', type: 'string' },
                    { name: null, type: 'string' },
                    { name: undefined, type: 'string' }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(0);
        });

        it('should trim whitespace when checking for duplicates', () => {
            const data = {
                attributes: [
                    { name: 'attr1', type: 'string' },
                    { name: ' attr1 ', type: 'integer' }, // same name with whitespace
                    { name: 'attr2', type: 'string' }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(2);
            expect(errors[0].instancePath).toBe('/attributes/0/name');
            expect(errors[1].instancePath).toBe('/attributes/1/name');
        });

        it('should validate range restrictions for integer attributes', () => {
            const data = {
                attributes: [
                    {
                        name: 'validRange',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 1,
                        restrictionsRangeMax: 10
                    },
                    {
                        name: 'invalidRange',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 10,
                        restrictionsRangeMax: 5 // min > max
                    }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(2);
            expect(errors[0]).toEqual({
                instancePath: '/attributes/1/restrictionsRangeMin',
                message: 'gnviewer.minError'
            });
            expect(errors[1]).toEqual({
                instancePath: '/attributes/1/restrictionsRangeMax',
                message: 'gnviewer.maxError'
            });
        });

        it('should validate range restrictions for float attributes', () => {
            const data = {
                attributes: [
                    {
                        name: 'validFloatRange',
                        type: 'float',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 1.5,
                        restrictionsRangeMax: 10.5
                    },
                    {
                        name: 'invalidFloatRange',
                        type: 'float',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 10.5,
                        restrictionsRangeMax: 5.5 // min > max
                    }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(2);
            expect(errors[0]).toEqual({
                instancePath: '/attributes/1/restrictionsRangeMin',
                message: 'gnviewer.minError'
            });
            expect(errors[1]).toEqual({
                instancePath: '/attributes/1/restrictionsRangeMax',
                message: 'gnviewer.maxError'
            });
        });

        it('should not validate range for non-range restrictions', () => {
            const data = {
                attributes: [
                    {
                        name: 'noneRestriction',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.None,
                        restrictionsRangeMin: 10,
                        restrictionsRangeMax: 5
                    },
                    {
                        name: 'optionsRestriction',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Options,
                        restrictionsRangeMin: 10,
                        restrictionsRangeMax: 5
                    }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(0);
        });

        it('should handle null range values', () => {
            const data = {
                attributes: [
                    {
                        name: 'nullMin',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: null,
                        restrictionsRangeMax: 10
                    },
                    {
                        name: 'nullMax',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 5,
                        restrictionsRangeMax: null
                    },
                    {
                        name: 'bothNull',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: null,
                        restrictionsRangeMax: null
                    }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(0);
        });

        it('should handle equal min and max values', () => {
            const data = {
                attributes: [
                    {
                        name: 'equalValues',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 5,
                        restrictionsRangeMax: 5
                    }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(0);
        });

        it('should validate both unique names and range restrictions', () => {
            const data = {
                attributes: [
                    {
                        name: 'duplicate',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 1,
                        restrictionsRangeMax: 10
                    },
                    {
                        name: 'duplicate',
                        type: 'integer',
                        restrictionsType: RestrictionsTypes.Range,
                        restrictionsRangeMin: 10,
                        restrictionsRangeMax: 5 // invalid range
                    }
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(4);

            // Check duplicate name errors
            const duplicateErrors = errors.filter(error => error.message === 'gnviewer.duplicateAttributeNameError');
            expect(duplicateErrors.length).toBe(2);

            // Check range errors
            const rangeErrors = errors.filter(error => error.message === 'gnviewer.minError' || error.message === 'gnviewer.maxError');
            expect(rangeErrors.length).toBe(2);
        });

        it('should handle missing properties gracefully', () => {
            const data = {
                attributes: [
                    { name: 'attr1' }, // missing type
                    { type: 'string' }, // missing name
                    { name: 'attr2', type: 'integer', restrictionsType: RestrictionsTypes.Range }, // missing range values
                    { name: 'attr3', type: 'string', restrictionsType: 'invalid' } // invalid restriction type
                ]
            };

            const errors = validateAttributes(data);
            expect(errors.length).toBe(0); // Should not throw errors for missing properties
        });
    });

    describe('getErrorByPath', () => {
        const mockErrors = [
            { instancePath: '/title', message: 'must NOT have fewer than 1 characters' },
            { instancePath: '/attributes/0/name', message: 'must be string' },
            { instancePath: '/attributes/1/type', message: 'must be integer' },
            { instancePath: '/attributes/2/restrictionsRangeMin', message: 'must be number' },
            { instancePath: '/attributes/3/name', message: 'gnviewer.duplicateAttributeNameError' },
            { instancePath: '/attributes/4/name', message: 'some other error' }
        ];

        it('should return undefined for non-existent path', () => {
            expect(getErrorByPath('/non/existent/path', mockErrors)).toBe(undefined);
            expect(getErrorByPath('/title', [])).toBe(undefined);
        });

        it('should return original message for non-override cases', () => {
            expect(getErrorByPath('/attributes/3/name', mockErrors)).toBe('gnviewer.duplicateAttributeNameError');
            expect(getErrorByPath('/attributes/4/name', mockErrors)).toBe('some other error');
        });

        it('should override minLength error message', () => {
            expect(getErrorByPath('/title', mockErrors)).toBe('gnviewer.minValueRequired');
        });

        it('should override string validation error message', () => {
            expect(getErrorByPath('/attributes/0/name', mockErrors)).toBe('gnviewer.stringValueRequired');
        });

        it('should override integer validation error message', () => {
            expect(getErrorByPath('/attributes/1/type', mockErrors)).toBe('gnviewer.integerValueRequired');
        });

        it('should override number validation error message', () => {
            expect(getErrorByPath('/attributes/2/restrictionsRangeMin', mockErrors)).toBe('gnviewer.numberValueRequired');
        });

        it('should handle empty errors array', () => {
            expect(getErrorByPath('/any/path', [])).toBe(undefined);
        });

        it('should handle null/undefined errors', () => {
            expect(getErrorByPath('/any/path', null)).toBe(undefined);
            expect(getErrorByPath('/any/path', undefined)).toBe(undefined);
        });

        it('should handle errors without message property', () => {
            const errorsWithoutMessage = [
                { instancePath: '/title' },
                { instancePath: '/attributes/0/name', message: null },
                { instancePath: '/attributes/1/name', message: undefined }
            ];

            expect(getErrorByPath('/title', errorsWithoutMessage)).toBe(undefined);
            expect(getErrorByPath('/attributes/0/name', errorsWithoutMessage)).toBe(null);
            expect(getErrorByPath('/attributes/1/name', errorsWithoutMessage)).toBe(undefined);
        });

        it('should handle partial message matches', () => {
            const partialMatchErrors = [
                { instancePath: '/test1', message: 'must NOT have fewer than 1 characters and more text' },
                { instancePath: '/test2', message: 'prefix must be string suffix' },
                { instancePath: '/test3', message: 'before must be integer after' },
                { instancePath: '/test4', message: 'start must be number end' }
            ];

            expect(getErrorByPath('/test1', partialMatchErrors)).toBe('gnviewer.minValueRequired');
            expect(getErrorByPath('/test2', partialMatchErrors)).toBe('gnviewer.stringValueRequired');
            expect(getErrorByPath('/test3', partialMatchErrors)).toBe('gnviewer.integerValueRequired');
            expect(getErrorByPath('/test4', partialMatchErrors)).toBe('gnviewer.numberValueRequired');
        });
    });
});
