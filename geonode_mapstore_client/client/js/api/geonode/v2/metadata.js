/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import {
    METADATA,
    RESOURCES,
    getEndpointUrl
} from './constants';
import isObject from 'lodash/isObject';
import isArray from 'lodash/isArray';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
const uiKeys = (entry) => Object.keys(entry).filter(propertyKey => propertyKey.indexOf('ui:') === 0);

const parseUiSchema = (properties) => {
    return Object.keys(properties).reduce((acc, key) => {
        const entry = properties[key];
        const uiKeysRoot = uiKeys(entry);
        if (uiKeysRoot.length) {
            acc[key] = Object.fromEntries(uiKeysRoot.map(uiKey => [uiKey, entry[uiKey]]));
        }
        if (entry.type === 'array') {
            const uiKeysNested = uiKeys(entry?.items);
            if (uiKeysNested.length) {
                acc[key] = Object.fromEntries(uiKeysNested.map(uiKey => [uiKey, entry?.items?.[uiKey]]));
            }
        }
        if (entry.type === 'object') {
            const nestedProperties = parseUiSchema(entry?.properties);
            acc[key] = { ...acc[key], ...nestedProperties };
        }
        if (entry.type === 'array' && entry.items?.type === 'object') {
            const nestedProperties = parseUiSchema(entry?.items?.properties);
            acc[key] = { ...acc[key], ...(!isEmpty(nestedProperties) && {items: {...nestedProperties}}) };
        }
        return acc;
    }, {});
};

let metadataSchemas;
export const getMetadataSchema = () => {
    if (metadataSchemas) {
        return Promise.resolve(metadataSchemas);
    }
    return axios.get(getEndpointUrl(METADATA, '/schema/'))
        .then(({ data }) => {
            // TODO test nested schema
            const test = {
                "cnr_sites": {
                    "type": "array",
                    "title": "Test nested schema",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "properties": {
                            "site": {
                                "title": "site",
                                "type": "object",
                                "properties": {
                                    "id": {
                                        "type": "string"
                                    },
                                    "label": {
                                        "type": "string"
                                    }
                                },
                                "ui:options": {
                                    "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/categories"
                                }
                            },
                            "locations": {
                                "title": "locations",
                                "type": "array",
                                "minItems": 1,
                                "items": {
                                    "type": "object",
                                    "title": "cnr_location",
                                    "properties": {
                                        "id": {
                                            "type": "string"
                                        },
                                        "label": {
                                            "type": "string"
                                        }
                                    },
                                    "ui:options": {
                                        "geonode-ui:referencevalue": "cnr_sites.[${index}].site.id",
                                        "geoode-ui:referencekey": "id",
                                        "geonode-ui:autocomplete": "/api/v2/metadata/autocomplete/categories?q=${id}"
                                    }
                                }
                            }
                        }
                    },
                    "geonode:handler": "sparse"
                }
            };
            const schema = {...data, properties: {...data.properties, ...test}};
            metadataSchemas = {
                schema: schema,
                uiSchema: parseUiSchema(schema?.properties || {})
            };
            return metadataSchemas;
        });
};

const removeNullValueRecursive = (metadata = {}, schema = {}) => {
    return Object.keys(metadata).reduce((acc, key) => {
        const schemaTypes = castArray(schema?.[key]?.type || []);
        if (metadata[key] === null && !schemaTypes.includes('null')) {
            return {
                ...acc,
                [key]: undefined
            };
        }
        return {
            ...acc,
            [key]: !isArray(metadata[key]) && isObject(metadata[key])
                ? removeNullValueRecursive(metadata[key], schema[key])
                : metadata[key]
        };
    }, {});
};

export const getMetadataByPk = (pk) => {
    return getMetadataSchema()
        .then(({ schema, uiSchema }) => {
            const resourceProperties = ['pk', 'title', 'detail_url', 'perms'];
            return Promise.all([
                axios.get(getEndpointUrl(METADATA, `/instance/${pk}/`)),
                axios.get(getEndpointUrl(RESOURCES, `/${pk}/?exclude[]=*&${resourceProperties.map(value => `include[]=${value}`).join('&')}`))
            ])
                .then((response) => {
                    const metadataResponse = response?.[0]?.data || {};
                    const resource = response?.[1]?.data?.resource || {};
                    const { extraErrors, ...metadata } = metadataResponse;
                    return {
                        schema,
                        uiSchema,
                        metadata: removeNullValueRecursive(metadata, schema?.properties),
                        resource,
                        extraErrors
                    };
                });
        });
};

export const updateMetadata = (pk, body) => {
    return axios.put(getEndpointUrl(METADATA, `/instance/${pk}/`), body)
        .then(({ data }) => data);
};
