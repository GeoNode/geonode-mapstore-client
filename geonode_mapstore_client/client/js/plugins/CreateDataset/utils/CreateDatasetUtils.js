/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

export const DEFAULT_ATTRIBUTE = {
    id: 'geom',
    name: 'geom',
    restrictionsType: RestrictionsTypes.None,
    nillable: false
};

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
                                "restrictionsRangeMin": {
                                    "type": "integer"
                                },
                                "restrictionsRangeMax": {
                                    "type": "integer"
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
                                                "type": "integer",
                                                "minLength": 1
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
                                        "type": "integer"
                                    },
                                    "restrictionsRangeMax": {
                                        "type": "integer"
                                    }
                                }
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
                                "restrictionsRangeMin": {
                                    "type": "number"
                                },
                                "restrictionsRangeMax": {
                                    "type": "number"
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
                                                "type": "number",
                                                "minLength": 1
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
                                        "type": "number"
                                    },
                                    "restrictionsRangeMax": {
                                        "type": "number"
                                    }
                                }
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
