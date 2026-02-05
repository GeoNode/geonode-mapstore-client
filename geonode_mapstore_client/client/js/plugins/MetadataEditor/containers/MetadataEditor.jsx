/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';

import { Alert } from 'react-bootstrap';
import isEmpty from 'lodash/isEmpty';

import { getMetadataByPk } from '@js/api/geonode/v2/metadata';
import widgets from '../components/_widgets';
import templates from '../components/_templates';
import fields from '../components/_fields';
import MainEventView from '@js/components/MainEventView';
import MainLoader from '@js/components/MainLoader';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';

function MetadataEditor({
    pk,
    loading,
    error,
    extraErrors: extraErrorsProp,
    metadata,
    schema,
    uiSchema,
    updateError,
    capitalizeFieldTitle,
    setLoading,
    setError,
    setUISchema,
    setSchema,
    setMetadata,
    setInitialMetadata,
    setUpdateError,
    setResource,
    updating,
    setExtraErrors,
    readOnly
}, { messages }) {

    const init = useRef(false);
    const initialize = useRef();
    const {__errors: rootErrors, ...extraErrors} = extraErrorsProp ?? {};
    initialize.current = (ref) => {
        if (ref?.validateForm && !init.current) {
            init.current = true;
            // force initial validation
            if (isEmpty(extraErrors)) {
                ref.validateForm();
            }
        }
    };
    useEffect(() => {
        if (pk) {
            setLoading(true);
            setError(false);
            getMetadataByPk(pk)
                .then((payload) => {
                    setUISchema(payload.uiSchema);
                    setSchema(payload.schema);
                    setMetadata(payload.metadata);
                    setInitialMetadata(payload.metadata);
                    setResource(payload.resource);
                    setExtraErrors(payload.extraErrors);
                })
                .catch(() => {
                    setError(true);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [pk]);

    useEffect(() => {
        return () => {
            // reset all errors
            setUpdateError(null);
            setExtraErrors({});
        };
    }, []);

    /*
     * tranform metadata to multilang format managed by widget `TextWidgetMultiLang` using `geonode:multilang-group` property
     * see also schemaToMultiLang() schema transformation
     * {
     *   'title': {
     *       "en": "Title in English",
     *       ...
     * }
     */
    function metadataToMultiLang(metadataSingleLang, schemaSingleLang) {
        return {
            ...metadataSingleLang,
            ...Object.keys(schemaSingleLang?.properties || {}).reduce((acc, key) => {
                const property = schemaSingleLang.properties[key];
                if (property?.['geonode:multilang']) {
                    acc[key] = Object.keys(metadataSingleLang || {}).reduce((langAcc, dataKey) => {
                        const dataProperty = schemaSingleLang.properties[dataKey];
                        if (dataProperty?.['geonode:multilang-group'] === key) {
                            const itemLang = dataProperty['geonode:multilang-lang'];
                            langAcc[itemLang] = metadataSingleLang[dataKey];
                        }
                        return langAcc;
                    }, {});
                }
                return acc;
            }, {})
        };
    }

    /*
     *  re-tranform multilang metadata to single lang format to post to backend api
     */
    function metadataToSingleLang(metadataMultiLang, schemaMultiLang) {
        const result = { ...metadataMultiLang };

        Object.keys(schemaMultiLang?.properties || {}).forEach(key => {
            const property = schemaMultiLang.properties[key];
            if (property?.['geonode:multilang'] && metadataMultiLang[key]) {
                Object.entries(metadataMultiLang[key] || {}).forEach(([lang, value]) => {
                    const singleLangKey = Object.keys(schemaMultiLang.properties).find(k => {
                        const prop = schemaMultiLang.properties[k];
                        return prop?.['geonode:multilang-group'] === key &&
                            prop?.['geonode:multilang-lang'] === lang;
                    });
                    if (singleLangKey) {
                        result[singleLangKey] = value;
                    }
                });
                // set empty the single lang field
                result[key] = '';
            }
        });

        return result;
    }

    function handleChange(formData) {
        const singleFormData = metadataToSingleLang(formData, schema);
        setUpdateError(null);
        setMetadata(singleFormData);
    }

    if (loading) {
        return (<MainLoader />);
    }

    if (error) {
        return (<MainEventView msgId={'gnviewer.metadataNotFound'} />);
    }

    if (!metadata && !schema) {
        return null;
    }

    /*
     * tranform schema to multilang schema, by `geonode:multilang-group` property
     * {
     *   'title': {
     *       "type": "object",
     *       "title": "Title multilanguage",
     *       "description": "same title object for multiple languages",
     *       "properties": {
     *           "en": {"type": "string" ...},
     *           "hy": {"type": "string" ...},
     *           "ru": {"type": "string" ...}
     *       }
     *   }
    * @param {*} schema
    * @param {*} uiSchemaMultiLang
    */
    function schemaToMultiLang(schemaSingleLang, uiSchemaSingleLang) {
        const uiSchemaMultiLang = { ...uiSchemaSingleLang };
        const schemaMultiLang = {
            ...schemaSingleLang,
            properties: Object.keys(schemaSingleLang?.properties || {}).reduce((acc, key) => {
                const property = { ...schemaSingleLang.properties[key] };
                if (property?.['geonode:multilang']) {
                    const newProperty = {
                        ...property,
                        type: 'object',
                        properties: {},
                        'ui:widget': "TextWidgetMultiLang",
                        'ui:options': {}
                    };
                    delete newProperty.maxLength;
                    acc[key] = newProperty;
                    // set custom widget for multilang text
                    uiSchemaMultiLang[key] = {
                        "ui:widget": "TextWidgetMultiLang"
                    };
                } else if (property?.['geonode:multilang-group']) {
                    const groupKey = property['geonode:multilang-group'];
                    const itemLang = property['geonode:multilang-lang'];
                    acc[groupKey].properties[itemLang] = property;
                    acc[groupKey]['ui:options'] = {
                        ...acc[groupKey]['ui:options'],
                        widget: property['ui:options']?.widget
                    };
                } else {
                    acc[key] = property;
                }
                return acc;
            }, {})
        };
        return { schemaMultiLang, uiSchemaMultiLang };
    }

    const {schemaMultiLang, uiSchemaMultiLang} = schemaToMultiLang(schema, uiSchema);
    const metadataMultiLang = metadataToMultiLang(metadata, schema);
    const defaultTitle = getMessageById(messages, 'gnviewer.metadataEditorTitle');

    return (
        <div className="gn-metadata">
            <div className="gn-metadata-header">
                {!isEmpty(updateError) && <Alert bsStyle={updateError.type} style={{ margin: '0.25rem 0' }}>
                    {updateError.message}
                    {!isEmpty(rootErrors) && <ul>{rootErrors.map((_error, idx) => <li key={idx}>{_error}</li>)}</ul>}
                </Alert>}
            </div>
            <div className="gn-metadata-container">
                <Form
                    liveValidate
                    readonly={readOnly}
                    ref={initialize.current}
                    formContext={{
                        title: metadata.title || metadataMultiLang.title?.en || Object.values(metadataMultiLang.title || {})[0] || defaultTitle,
                        metadata: metadataMultiLang,
                        capitalizeTitle: capitalizeFieldTitle,
                        messages
                    }}
                    schema={schemaMultiLang}
                    uiSchema={uiSchemaMultiLang}
                    formData={metadataMultiLang}
                    widgets={widgets}
                    validator={validator}
                    templates={templates}
                    fields={fields}
                    extraErrors={extraErrors}
                    transformErrors={(errors) => {
                        return errors.filter(err => err.message !== 'must be equal to constant').map(err => {
                            const errorMessage = (err.message || '').startsWith('must have required property')
                                ? 'must have required property'
                                : err.message;
                            const messageId = `metadata.error.${errorMessage}`;
                            const message = getMessageById(messages, messageId);
                            return {
                                ...err,
                                message: messageId === message ? errorMessage : message
                            };
                        });
                    }}
                    experimental_defaultFormStateBehavior={{
                        arrayMinItems: {
                            populate: 'never',
                            mergeExtraDefaults: false
                        }
                    }}
                    onChange={({ formData }) => {
                        handleChange(formData);
                    }}
                >
                    <></>
                </Form>
            </div>
            {updating ? <MainLoader style={{ opacity: 0.5 }} /> : null}
        </div>
    );
}

MetadataEditor.contextTypes = {
    messages: PropTypes.object
};

MetadataEditor.defaultProps = {
    capitalizeFieldTitle: true
};

export default MetadataEditor;


