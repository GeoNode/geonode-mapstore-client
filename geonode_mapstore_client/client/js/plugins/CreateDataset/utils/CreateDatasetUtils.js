/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { v4 as uuid } from 'uuid';
import isNil from 'lodash/isNil';

export const AttributeTypes = {
    Point: "Point",
    LineString: "LineString",
    Polygon: "Polygon",
    String: "string",
    Integer: "integer",
    Float: "float",
    Date: "date"
};

export const RestrictionsTypes = {
    None: "none",
    Range: "range",
    Options: "options"
};

export const DEFAULT_GEOMETRY_ATTRIBUTE = {
    id: 'geom',
    name: 'geom',
    restrictionsType: RestrictionsTypes.None,
    nillable: false
};

export const DEFAULT_ATTRIBUTE = {
    title: '',
    geometry_type: AttributeTypes.Point,
    attributes: []
};

/**
 * Parse a number string to a number
 * @param {string} value - The value to parse
 * @returns {number} The parsed number
 */
export const parseNumber = (value) => {
    if (value === '') {
        return null;
    }
    return parseFloat(value);
};

/**
 * Get the attribute control id
 * @param {Object} data - The data to get the attribute control id from
 * @param {string} suffix - The suffix to add to the attribute control id
 * @returns {string} The attribute control id
 */
export const getAttributeControlId = (data, suffix) =>
    `attribute-${data?.id ?? ''}-${suffix}`;

/**
 * The JSON schema for the dataset
 * @type {Object}
 */
export const validateSchema = {
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
            "minLength": 1
        },
        "geometry_type": {
            "type": "string",
            "enum": [AttributeTypes.Point, AttributeTypes.LineString, AttributeTypes.Polygon]
        },
        "attributes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "minLength": 1
                    },
                    "type": {
                        "type": "string",
                        "enum": [AttributeTypes.String, AttributeTypes.Integer, AttributeTypes.Float, AttributeTypes.Date]
                    },
                    "nillable": {
                        "type": "boolean"
                    }
                },
                "required": ["name", "type"],
                "allOf": [
                    {
                        "if": {
                            "properties": {
                                "type": { "const": AttributeTypes.Integer }
                            }
                        },
                        "then": {
                            "properties": {
                                "restrictionsType": {
                                    "type": "string",
                                    "enum": [RestrictionsTypes.None, RestrictionsTypes.Range, RestrictionsTypes.Options]
                                },
                                "restrictionsOptions": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": {
                                                "type": "string"
                                            },
                                            "value": {
                                                "type": "integer"
                                            }
                                        }
                                    }
                                }
                            },
                            "if": {
                                "properties": {
                                    "restrictionsType": { "const": RestrictionsTypes.Range }
                                }
                            },
                            "then": {
                                "properties": {
                                    "restrictionsRangeMin": {
                                        "type": ["integer", "null"]
                                    },
                                    "restrictionsRangeMax": {
                                        "type": ["integer", "null"]
                                    }
                                },
                                "anyOf": [
                                    {
                                        "properties": {
                                            "restrictionsRangeMin": { "type": "integer" }
                                        }
                                    },
                                    {
                                        "properties": {
                                            "restrictionsRangeMax": { "type": "integer" }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "if": {
                            "properties": {
                                "type": { "const": AttributeTypes.Float }
                            }
                        },
                        "then": {
                            "properties": {
                                "restrictionsType": {
                                    "type": "string",
                                    "enum": [RestrictionsTypes.None, RestrictionsTypes.Range, RestrictionsTypes.Options]
                                },
                                "restrictionsOptions": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": {
                                                "type": "string"
                                            },
                                            "value": {
                                                "type": "number"
                                            }
                                        }
                                    }
                                }
                            },
                            "if": {
                                "properties": {
                                    "restrictionsType": { "const": RestrictionsTypes.Range }
                                }
                            },
                            "then": {
                                "properties": {
                                    "restrictionsRangeMin": {
                                        "type": ["number", "null"]
                                    },
                                    "restrictionsRangeMax": {
                                        "type": ["number", "null"]
                                    }
                                },
                                "anyOf": [
                                    {
                                        "properties": {
                                            "restrictionsRangeMin": { "type": "number" }
                                        }
                                    },
                                    {
                                        "properties": {
                                            "restrictionsRangeMax": { "type": "number" }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    {
                        "if": {
                            "properties": {
                                "type": { "const": AttributeTypes.String }
                            }
                        },
                        "then": {
                            "properties": {
                                "restrictionsType": {
                                    "type": "string",
                                    "enum": [RestrictionsTypes.None, RestrictionsTypes.Options]
                                },
                                "restrictionsOptions": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "id": {
                                                "type": "string"
                                            },
                                            "value": {
                                                "type": "string",
                                                "minLength": 1
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        "if": {
                            "properties": {
                                "type": { "const": AttributeTypes.Date }
                            }
                        },
                        "then": {
                            "properties": {
                                "restrictionsType": {
                                    "type": "string",
                                    "enum": [RestrictionsTypes.None]
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    "required": ["title", "geometry_type"]
};

/**
 * Validate attribute data including range values and unique names
 * @param {Object} data - The data to validate
 * @returns {Array} The array of errors
 */
export const validateAttributes = (data = {}) => {
    const errors = [];

    if (!Array.isArray(data.attributes)) return errors;

    // Count names occurrences
    const nameCounts = data.attributes.reduce((counts, attr) => {
        const name = attr?.name?.trim();
        if (name) counts[name] = (counts[name] || 0) + 1;
        return counts;
    }, {});

    data.attributes.forEach((attr, index) => {
        const name = attr?.name?.trim();

        // Check if name is unique
        if (name && nameCounts[name] > 1) {
            errors.push({
                instancePath: `/attributes/${index}/name`,
                message: 'gnviewer.duplicateAttributeNameError'
            });
        }

        // Check if range values are valid
        if (attr?.restrictionsType === RestrictionsTypes.Range) {
            const { restrictionsRangeMin: min, restrictionsRangeMax: max } = attr;
            if (min !== null && max !== null && min > max) {
                errors.push({
                    instancePath: `/attributes/${index}/restrictionsRangeMin`,
                    message: 'gnviewer.minError'
                });
                errors.push({
                    instancePath: `/attributes/${index}/restrictionsRangeMax`,
                    message: 'gnviewer.maxError'
                });
            }
        }
    });

    return errors;
};

/**
 * Get the error message by path
 * @param {string} path - The path to the error
 * @param {Array} allErrors - The array of errors
 * @returns {string} The error message
 */
export const getErrorByPath = (path, allErrors) => {
    const error = allErrors?.find(err => err.instancePath === path);
    if (error?.message) {
        // Override specific error messages
        if (error.message.includes('must NOT have fewer than 1 characters')) {
            return 'gnviewer.minValueRequired';
        }
        if (error.message.includes('must be string')) {
            return 'gnviewer.stringValueRequired';
        }
        if (error.message.includes('must be integer')) {
            return 'gnviewer.integerValueRequired';
        }
        if (error.message.includes('must be number')) {
            return 'gnviewer.numberValueRequired';
        }
    }
    return error?.message;
};

const JSON_SCHEMA_TYPE_TO_ATTRIBUTE_TYPE = {
    [AttributeTypes.String]: AttributeTypes.String,
    [AttributeTypes.Integer]: AttributeTypes.Integer,
    number: AttributeTypes.Float
};

/**
 * Parse JSON Schema and convert it to dataset attributes
 * @param {Object} schema - The JSON Schema object
 * @returns {Object} - Parsed result with dataset data and any errors
 */
export const parseJSONSchema = (schema) => {
    const errors = [];
    const warnings = [];

    const fail = (errorId) => ({ dataset: null, errors: [...errors, errorId], warnings });
    const addWarning = (msgId, msgParams) => warnings.push({ msgId, msgParams });

    try {
        // Basic validations with early returns
        if (!schema || typeof schema !== 'object') return fail('gnviewer.invalidSchemaStructure');
        if (schema.type !== 'object') return fail('gnviewer.schemaMustBeObject');
        if (!schema.properties || typeof schema.properties !== 'object') {
            return fail('gnviewer.schemaMustHaveProperties');
        }

        const { title = 'Untitled Dataset', properties, required = [] } = schema;
        const requiredSet = new Set(required);

        // Geometry type extraction
        const geomProp = properties.geom;
        let geometryType = AttributeTypes.Point;
        if (geomProp) {
            if (geomProp.const
                && [
                    AttributeTypes.Point,
                    AttributeTypes.LineString,
                    AttributeTypes.Polygon
                ].includes(geomProp.const)
            ) {
                geometryType = geomProp.const;
            } else {
                addWarning('gnviewer.invalidGeometryType');
            }
        } else {
            addWarning('gnviewer.noGeometryProperty');
        }

        // Attribute extraction with optimized processing
        const attributes = [];
        for (const [propName, prop] of Object.entries(properties)) {
            if (propName === 'geom') continue;

            // Determine attribute type
            const baseType = JSON_SCHEMA_TYPE_TO_ATTRIBUTE_TYPE[prop.type];
            if (!baseType) {
                addWarning('gnviewer.unsupportedPropertyType',
                    { propName, propType: prop.type ?? 'unknown' });
                continue;
            }

            const attribute = {
                id: uuid(),
                name: propName,
                type: prop.format === 'date' ? AttributeTypes.Date : baseType,
                restrictionsType: RestrictionsTypes.None,
                nillable: !requiredSet.has(propName)
            };

            // Handle enum restrictions
            if (Array.isArray(prop.enum)) {
                if (prop.format === 'date') {
                    addWarning('gnviewer.enumNotSupportedForDate', { propName });
                } else {
                    const isString = attribute.type === AttributeTypes.String;
                    const isInteger = attribute.type === AttributeTypes.Integer;
                    if (isString && prop.enum.some(value => typeof value !== 'string')) {
                        addWarning('gnviewer.enumMustBeString', { propName });
                    }
                    attribute.restrictionsType = RestrictionsTypes.Options;
                    attribute.restrictionsOptions = prop.enum.map(value => ({
                        id: uuid(),
                        value: isNil(value) ? null
                            : isString
                                ? String(value)
                                : isInteger
                                    ? Number(value)
                                    : parseNumber(value)
                    }));
                }
                // Handle range restrictions
            } else if (prop.minimum !== undefined || prop.maximum !== undefined) {
                if (attribute.type === AttributeTypes.String) {
                    addWarning('gnviewer.rangeNotSupportedForString', { propName });
                } else if (prop.format === 'date') {
                    addWarning('gnviewer.rangeNotSupportedForDate', { propName });
                } else {
                    const min = prop.minimum;
                    const max = prop.maximum;

                    // Validate that both min and max are not empty/undefined
                    if (isNil(min) && isNil(max)) {
                        addWarning('gnviewer.rangeCannotBeEmpty', { propName });
                    } else {
                        if (typeof min === 'string' || typeof max === 'string') {
                            addWarning('gnviewer.rangeMustBeNumeric', { propName });
                        }

                        const isInteger = attribute.type === AttributeTypes.Integer;
                        attribute.restrictionsType = RestrictionsTypes.Range;
                        attribute.restrictionsRangeMin = isNil(min) ? null : isInteger ? Number(min) : parseNumber(min);
                        attribute.restrictionsRangeMax = isNil(max) ? null : isInteger ? Number(max) : parseNumber(max);
                    }
                }
            }

            attributes.push(attribute);
        }

        return {
            dataset: { title, geometry_type: geometryType, attributes },
            errors,
            warnings
        };
    } catch (err) {
        errors.push('gnviewer.schemaParseError');
        return { dataset: null, errors, warnings };
    }
};
