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
    parseNumber,
    getAttributeControlId,
    parseJSONSchema,
    AttributeTypes,
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

    describe('parseNumber', () => {
        it('should return null for empty string', () => {
            expect(parseNumber('')).toBe(null);
        });

        it('should parse valid integer strings', () => {
            expect(parseNumber('123')).toBe(123);
            expect(parseNumber('0')).toBe(0);
            expect(parseNumber('-456')).toBe(-456);
        });

        it('should parse valid float strings', () => {
            expect(parseNumber('123.45')).toBe(123.45);
            expect(parseNumber('0.5')).toBe(0.5);
            expect(parseNumber('-78.9')).toBe(-78.9);
            expect(parseNumber('3.14159')).toBe(3.14159);
        });

        it('should parse scientific notation', () => {
            expect(parseNumber('1e5')).toBe(100000);
            expect(parseNumber('2.5e-3')).toBe(0.0025);
            expect(parseNumber('-1.23e+2')).toBe(-123);
        });

        it('should handle edge cases', () => {
            expect(parseNumber('0.0')).toBe(0);
            expect(parseNumber('-0')).toBe(-0);
            expect(parseNumber('Infinity')).toBe(Infinity);
            expect(parseNumber('-Infinity')).toBe(-Infinity);
        });

        it('should return NaN for invalid strings', () => {
            expect(parseNumber('abc')).toBeFalsy();
            expect(parseNumber('12.34.56')).toBe(12.34);
            expect(parseNumber('not a number')).toBeFalsy();
            expect(parseNumber('123abc')).toBe(123);
        });

        it('should handle whitespace', () => {
            expect(parseNumber('  123  ')).toBe(123);
            expect(parseNumber('\t45.6\n')).toBe(45.6);
            expect(parseNumber('  ')).toBeFalsy();
        });

        it('should handle special values', () => {
            expect(parseNumber('NaN')).toBeFalsy();
        });
    });

    describe('getAttributeControlId', () => {
        it('should generate control ID with valid data and suffix', () => {
            const data = { id: 'test-123' };
            const suffix = 'name';
            expect(getAttributeControlId(data, suffix)).toBe('attribute-test-123-name');
        });

        it('should handle different suffix values', () => {
            const data = { id: 'attr-456' };
            expect(getAttributeControlId(data, 'type')).toBe('attribute-attr-456-type');
            expect(getAttributeControlId(data, 'nillable')).toBe('attribute-attr-456-nillable');
            expect(getAttributeControlId(data, 'restrictions')).toBe('attribute-attr-456-restrictions');
        });

        it('should handle data with no id property', () => {
            const data = { name: 'test' };
            const suffix = 'name';
            expect(getAttributeControlId(data, suffix)).toBe('attribute--name');
        });

        it('should handle null data', () => {
            const suffix = 'name';
            expect(getAttributeControlId(null, suffix)).toBe('attribute--name');
        });

        it('should handle undefined data', () => {
            const suffix = 'name';
            expect(getAttributeControlId(undefined, suffix)).toBe('attribute--name');
        });

        it('should handle empty object', () => {
            const data = {};
            const suffix = 'name';
            expect(getAttributeControlId(data, suffix)).toBe('attribute--name');
        });

        it('should handle empty suffix', () => {
            const data = { id: 'test-123' };
            const suffix = '';
            expect(getAttributeControlId(data, suffix)).toBe('attribute-test-123-');
        });

        it('should handle special characters in id', () => {
            const data = { id: 'test-123_abc.def' };
            const suffix = 'name';
            expect(getAttributeControlId(data, suffix)).toBe('attribute-test-123_abc.def-name');
        });
    });

    describe('parseJSONSchema', () => {
        describe('Basic validation', () => {
            it('should return error for null schema', () => {
                const result = parseJSONSchema(null);
                expect(result.dataset).toBe(null);
                expect(result.errors).toEqual(['gnviewer.invalidSchemaStructure']);
                expect(result.warnings).toEqual([]);
            });

            it('should return error for undefined schema', () => {
                const result = parseJSONSchema(undefined);
                expect(result.dataset).toBe(null);
                expect(result.errors).toEqual(['gnviewer.invalidSchemaStructure']);
                expect(result.warnings).toEqual([]);
            });

            it('should return error for non-object schema', () => {
                const result = parseJSONSchema('not an object');
                expect(result.dataset).toBe(null);
                expect(result.errors).toEqual(['gnviewer.invalidSchemaStructure']);
                expect(result.warnings).toEqual([]);
            });

            it('should return error for schema without type object', () => {
                const schema = { type: 'string', properties: {} };
                const result = parseJSONSchema(schema);
                expect(result.dataset).toBe(null);
                expect(result.errors).toEqual(['gnviewer.schemaMustBeObject']);
                expect(result.warnings).toEqual([]);
            });

            it('should return error for schema without properties', () => {
                const schema = { type: 'object' };
                const result = parseJSONSchema(schema);
                expect(result.dataset).toBe(null);
                expect(result.errors).toEqual(['gnviewer.schemaMustHaveProperties']);
                expect(result.warnings).toEqual([]);
            });

            it('should return error for schema with non-object properties', () => {
                const schema = { type: 'object', properties: 'not an object' };
                const result = parseJSONSchema(schema);
                expect(result.dataset).toBe(null);
                expect(result.errors).toEqual(['gnviewer.schemaMustHaveProperties']);
                expect(result.warnings).toEqual([]);
            });
        });

        describe('Successful parsing', () => {
            it('should parse basic schema with string properties', () => {
                const schema = {
                    type: 'object',
                    title: 'Test Dataset',
                    properties: {
                        name: { type: 'string' },
                        age: { type: 'integer' },
                        height: { type: 'number' }
                    },
                    required: ['name']
                };

                const result = parseJSONSchema(schema);
                expect(result.errors).toEqual([]);
                expect(result.warnings.length).toBe(1); // noGeometryProperty warning
                expect(result.warnings[0].msgId).toBe('gnviewer.noGeometryProperty');
                expect(result.dataset.title).toBe('Test Dataset');
                expect(result.dataset.geometry_type).toBe(AttributeTypes.Point);
                expect(result.dataset.attributes.length).toBe(3);

                const nameAttr = result.dataset.attributes.find(attr => attr.name === 'name');
                expect(nameAttr.type).toBe(AttributeTypes.String);
                expect(nameAttr.nillable).toBe(false); // required

                const ageAttr = result.dataset.attributes.find(attr => attr.name === 'age');
                expect(ageAttr.type).toBe(AttributeTypes.Integer);
                expect(ageAttr.nillable).toBe(true); // not required
            });

            it('should use default title when not provided', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.dataset.title).toBe('Untitled Dataset');
            });

            it('should handle empty properties object', () => {
                const schema = {
                    type: 'object',
                    properties: {}
                };

                const result = parseJSONSchema(schema);
                expect(result.dataset.attributes).toEqual([]);
                expect(result.warnings.length).toBe(1); // noGeometryProperty warning
            });
        });

        describe('Geometry handling', () => {
            it('should handle valid geometry types', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        geom: { "const": AttributeTypes.Point },
                        name: { type: 'string' }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.dataset.geometry_type).toBe(AttributeTypes.Point);
                expect(result.warnings.length).toBe(0);
            });

            it('should handle LineString geometry', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        geom: { "const": AttributeTypes.LineString }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.dataset.geometry_type).toBe(AttributeTypes.LineString);
            });

            it('should handle Polygon geometry', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        geom: { "const": AttributeTypes.Polygon }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.dataset.geometry_type).toBe(AttributeTypes.Polygon);
            });

            it('should warn for invalid geometry type', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        geom: { "const": 'InvalidType' }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.dataset.geometry_type).toBe(AttributeTypes.Point);
                expect(result.warnings.length).toBe(1);
                expect(result.warnings[0].msgId).toBe('gnviewer.invalidGeometryType');
            });

            it('should warn when no geometry property', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.warnings.length).toBe(1);
                expect(result.warnings[0].msgId).toBe('gnviewer.noGeometryProperty');
            });
        });

        describe('Attribute type mapping', () => {
            it('should map string type correctly', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        text: { type: 'string' }
                    }
                };

                const result = parseJSONSchema(schema);
                const textAttr = result.dataset.attributes.find(attr => attr.name === 'text');
                expect(textAttr.type).toBe(AttributeTypes.String);
            });

            it('should map integer type correctly', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        count: { type: 'integer' }
                    }
                };

                const result = parseJSONSchema(schema);
                const countAttr = result.dataset.attributes.find(attr => attr.name === 'count');
                expect(countAttr.type).toBe(AttributeTypes.Integer);
            });

            it('should map number type to float', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        value: { type: 'number' }
                    }
                };

                const result = parseJSONSchema(schema);
                const valueAttr = result.dataset.attributes.find(attr => attr.name === 'value');
                expect(valueAttr.type).toBe(AttributeTypes.Float);
            });

            it('should handle date format', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        created: { type: 'string', format: 'date' }
                    }
                };

                const result = parseJSONSchema(schema);
                const createdAttr = result.dataset.attributes.find(attr => attr.name === 'created');
                expect(createdAttr.type).toBe(AttributeTypes.Date);
            });

            it('should warn for unsupported property type', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        unsupported: { type: 'array' }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.warnings.length).toBe(2); // noGeometryProperty + unsupportedPropertyType
                const warning = result.warnings.find(w => w.msgId === 'gnviewer.unsupportedPropertyType');
                expect(warning.msgParams).toEqual({ propName: 'unsupported', propType: 'array' });
            });
        });

        describe('Enum restrictions', () => {
            it('should handle string enum restrictions', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            "enum": ['active', 'inactive', 'pending']
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const statusAttr = result.dataset.attributes.find(attr => attr.name === 'status');
                expect(statusAttr.restrictionsType).toBe(RestrictionsTypes.Options);
                expect(statusAttr.restrictionsOptions.length).toBe(3);
                expect(statusAttr.restrictionsOptions.map(opt => opt.value)).toEqual(['active', 'inactive', 'pending']);
            });

            it('should handle integer enum restrictions', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        priority: {
                            type: 'integer',
                            "enum": [1, 2, 3, 4, 5]
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const priorityAttr = result.dataset.attributes.find(attr => attr.name === 'priority');
                expect(priorityAttr.restrictionsType).toBe(RestrictionsTypes.Options);
                expect(priorityAttr.restrictionsOptions.map(opt => opt.value)).toEqual([1, 2, 3, 4, 5]);
            });

            it('should warn for enum with mixed types in string field', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        mixed: {
                            type: 'string',
                            "enum": ['text', 123, true]
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const warning = result.warnings.find(w => w.msgId === 'gnviewer.enumMustBeString');
                expect(warning.msgParams).toEqual({ propName: 'mixed' });
            });

            it('should warn for enum on date field', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            format: 'date',
                            "enum": ['2023-01-01', '2023-01-02']
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const warning = result.warnings.find(w => w.msgId === 'gnviewer.enumNotSupportedForDate');
                expect(warning.msgParams).toEqual({ propName: 'date' });
            });

            it('should handle null values in enum', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        nullable: {
                            type: 'string',
                            "enum": ['value1', null, 'value2']
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const nullableAttr = result.dataset.attributes.find(attr => attr.name === 'nullable');
                expect(nullableAttr.restrictionsOptions.map(opt => opt.value)).toEqual(['value1', null, 'value2']);
            });
        });

        describe('Range restrictions', () => {
            it('should handle numeric range restrictions', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        score: {
                            type: 'number',
                            minimum: 0,
                            maximum: 100
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const scoreAttr = result.dataset.attributes.find(attr => attr.name === 'score');
                expect(scoreAttr.restrictionsType).toBe(RestrictionsTypes.Range);
                expect(scoreAttr.restrictionsRangeMin).toBe(0);
                expect(scoreAttr.restrictionsRangeMax).toBe(100);
            });

            it('should handle integer range restrictions', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        age: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 120
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const ageAttr = result.dataset.attributes.find(attr => attr.name === 'age');
                expect(ageAttr.restrictionsType).toBe(RestrictionsTypes.Range);
                expect(ageAttr.restrictionsRangeMin).toBe(0);
                expect(ageAttr.restrictionsRangeMax).toBe(120);
            });

            it('should handle only minimum range', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        positive: {
                            type: 'number',
                            minimum: 0
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const positiveAttr = result.dataset.attributes.find(attr => attr.name === 'positive');
                expect(positiveAttr.restrictionsType).toBe(RestrictionsTypes.Range);
                expect(positiveAttr.restrictionsRangeMin).toBe(0);
                expect(positiveAttr.restrictionsRangeMax).toBe(null);
            });

            it('should handle only maximum range', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        limited: {
                            type: 'number',
                            maximum: 1000
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const limitedAttr = result.dataset.attributes.find(attr => attr.name === 'limited');
                expect(limitedAttr.restrictionsType).toBe(RestrictionsTypes.Range);
                expect(limitedAttr.restrictionsRangeMin).toBe(null);
                expect(limitedAttr.restrictionsRangeMax).toBe(1000);
            });

            it('should warn for range on string field', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        text: {
                            type: 'string',
                            minimum: 5,
                            maximum: 10
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const warning = result.warnings.find(w => w.msgId === 'gnviewer.rangeNotSupportedForString');
                expect(warning.msgParams).toEqual({ propName: 'text' });
            });

            it('should warn for range on date field', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            format: 'date',
                            minimum: '2023-01-01',
                            maximum: '2023-12-31'
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const warning = result.warnings.find(w => w.msgId === 'gnviewer.rangeNotSupportedForDate');
                expect(warning.msgParams).toEqual({ propName: 'date' });
            });

            it('should warn for string range values', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        value: {
                            type: 'number',
                            minimum: '0',
                            maximum: '100'
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const warning = result.warnings.find(w => w.msgId === 'gnviewer.rangeMustBeNumeric');
                expect(warning.msgParams).toEqual({ propName: 'value' });
            });

            it('should warn when both min and max are empty', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        emptyRange: {
                            type: 'number',
                            minimum: null,
                            maximum: undefined
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                const warning = result.warnings.find(w => w.msgId === 'gnviewer.rangeCannotBeEmpty');
                expect(warning.msgParams).toEqual({ propName: 'emptyRange' });
            });
        });

        describe('Required fields', () => {
            it('should mark required fields as non-nillable', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        required: { type: 'string' },
                        optional: { type: 'string' }
                    },
                    required: ['required']
                };

                const result = parseJSONSchema(schema);
                const requiredAttr = result.dataset.attributes.find(attr => attr.name === 'required');
                const optionalAttr = result.dataset.attributes.find(attr => attr.name === 'optional');

                expect(requiredAttr.nillable).toBe(false);
                expect(optionalAttr.nillable).toBe(true);
            });

            it('should handle empty required array', () => {
                const schema = {
                    type: 'object',
                    properties: {
                        field: { type: 'string' }
                    },
                    required: []
                };

                const result = parseJSONSchema(schema);
                const fieldAttr = result.dataset.attributes.find(attr => attr.name === 'field');
                expect(fieldAttr.nillable).toBe(true);
            });
        });

        describe('Error handling', () => {
            it('should handle parsing errors gracefully', () => {
                // Mock a function that throws an error
                const originalConsole = console.error;
                console.error = () => {}; // Suppress console.error for test

                const schema = {
                    type: 'object',
                    properties: {
                        // This will cause an error when trying to access properties
                        get test() {
                            throw new Error('Test error');
                        }
                    }
                };

                const result = parseJSONSchema(schema);
                expect(result.dataset).toBe(null);
                expect(result.errors).toEqual(['gnviewer.schemaParseError']);

                console.error = originalConsole;
            });
        });

        describe('Complex scenarios', () => {
            it('should handle complete schema with all features', () => {
                const schema = {
                    type: 'object',
                    title: 'Complete Dataset',
                    properties: {
                        geom: { "const": AttributeTypes.Polygon },
                        name: {
                            type: 'string',
                            "enum": ['Type A', 'Type B', 'Type C']
                        },
                        score: {
                            type: 'number',
                            minimum: 1.1,
                            maximum: 100.2
                        },
                        age: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 120
                        },
                        created: {
                            type: 'string',
                            format: 'date'
                        },
                        description: { type: 'string' }
                    },
                    required: ['name', 'score']
                };

                const result = parseJSONSchema(schema);
                expect(result.errors).toEqual([]);
                expect(result.warnings).toEqual([]);
                expect(result.dataset.title).toBe('Complete Dataset');
                expect(result.dataset.geometry_type).toBe(AttributeTypes.Polygon);
                expect(result.dataset.attributes.length).toBe(5); // geom is excluded

                const nameAttr = result.dataset.attributes.find(attr => attr.name === 'name');
                expect(nameAttr.restrictionsType).toBe(RestrictionsTypes.Options);
                expect(nameAttr.nillable).toBe(false);

                const scoreAttr = result.dataset.attributes.find(attr => attr.name === 'score');
                expect(scoreAttr.restrictionsType).toBe(RestrictionsTypes.Range);
                expect(scoreAttr.nillable).toBe(false);
                expect(scoreAttr.restrictionsRangeMin).toBe(1.1);
                expect(scoreAttr.restrictionsRangeMax).toBe(100.2);

                const ageAttr = result.dataset.attributes.find(attr => attr.name === 'age');
                expect(ageAttr.restrictionsType).toBe(RestrictionsTypes.Range);
                expect(ageAttr.nillable).toBe(true);
                expect(ageAttr.restrictionsRangeMin).toBe(0);
                expect(ageAttr.restrictionsRangeMax).toBe(120);

                const createdAttr = result.dataset.attributes.find(attr => attr.name === 'created');
                expect(createdAttr.type).toBe(AttributeTypes.Date);
                expect(createdAttr.restrictionsType).toBe(RestrictionsTypes.None);
            });
        });
    });
});
