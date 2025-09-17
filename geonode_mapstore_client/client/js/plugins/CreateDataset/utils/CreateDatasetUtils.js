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
                                                type: "string"
                                            },
                                            "value": {
                                                "type": "integer",
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

