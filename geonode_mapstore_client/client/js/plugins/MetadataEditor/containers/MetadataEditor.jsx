/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';
import { ObjectFieldTemplateProps } from "@rjsf/utils";

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

    const formTitle = metadata?.title || getMessageById(messages, 'gnviewer.metadataEditorTitle', 'Metadata Editor');

    function metadataToMultiLang(metadata, schema) {
        return {
            ...metadata,
            ...Object.keys(schema?.properties || {}).reduce((acc, key) => {
                const property = schema.properties[key];
                if (property?.['geonode:multilang'] === true) {
                    acc[key] = Object.keys(metadata || {}).reduce((langAcc, dataKey) => {
                        const dataProperty = schema.properties[dataKey];
                        if (dataProperty?.['geonode:multilang-group'] === key) {
                            const itemLang = dataProperty['geonode:multilang-lang'];
                            langAcc[itemLang] = metadata[dataKey];
                        }
                        return langAcc;
                    }, {});
                }
                return acc;
            }, {})
        };
    };

    function metadataToSingleLang(metadataMultiLang, schema) {
        const result = { ...metadataMultiLang };
        
        Object.keys(schema?.properties || {}).forEach(key => {
            const property = schema.properties[key];
            if (property?.['geonode:multilang'] === true && metadataMultiLang[key]) {
                Object.entries(metadataMultiLang[key] || {}).forEach(([lang, value]) => {
                    const singleLangKey = Object.keys(schema.properties).find(k => {
                        const prop = schema.properties[k];
                        return prop?.['geonode:multilang-group'] === key && 
                            prop?.['geonode:multilang-lang'] === lang;
                    });
                    if (singleLangKey) {
                        result[singleLangKey] = value;
                    }
                });
                // set empty the single lang field
                result[key] = '';
                //TODO or use default lang EN
            }
        });

        return result;
    };

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

    const uiSchemaMultiLang = {
        ...uiSchema
    };

    /**
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
    * @returns 
    */
    function schemaToMultiLang(schema, uiSchemaMultiLang) {
        return {
            ...schema,
            properties: Object.keys(schema?.properties || {}).reduce((acc, key) => {
                const property = schema.properties[key];
                if (property?.['geonode:multilang'] === true) {
                    property.type = 'object';
                    property.properties = {};
                    property['ui:widget'] = "TextWidgetMultiLang";
                    property['ui:options'] = {}
                    delete property?.maxLength;
                    acc[key] = property;
                    //set custom widget for multilang text
                    uiSchemaMultiLang[key] = {
                        "ui:widget": "TextWidgetMultiLang",
                    };
                }
                else if (property?.['geonode:multilang-group']) {
                    const groupKey = property['geonode:multilang-group'];
                    const itemLang = property['geonode:multilang-lang'];
                    acc[groupKey].properties[itemLang] = property;
                    acc[groupKey]['ui:options'] = {
                        ...acc[groupKey]['ui:options'],
                        widget: property['ui:options']?.widget
                    }
                }
                else {
                    acc[key] = property;
                }
                return acc;
            }, {})
        };
    }

    const schemaMultiLang = schemaToMultiLang(schema, uiSchemaMultiLang);
    const metadataMultiLang = metadataToMultiLang(metadata, schema);
    // console.log('MetadataEditor', {
    //     widgets, templates,
    //     metadata,
    //     metadataMultiLang,
    //     schema,
    //     schemaMultiLang,
    //     uiSchema,
    //     uiSchemaMultiLang,
    // });

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
                        title: formTitle,
                        metadata: metadataMultiLang,
                        capitalizeTitle: capitalizeFieldTitle
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



// DOCS: https://rjsf-team.github.io/react-jsonschema-form/docs/version-5.24.10/advanced-customization/custom-templates/#objectfieldtemplate
// function GroupedObjectFieldTemplate(props) {
//   const groups = {};
//   const ungrouped = [];

//   props.properties.forEach((prop) => {
//     const uiSchema =
//       prop.content &&
//       prop.content.props &&
//       prop.content.props.uiSchema;

//     const group = uiSchema && uiSchema["ui:group"];

//     if (group) {
//       if (!groups[group]) {
//         groups[group] = [];
//       }
//       groups[group].push(prop);
//     } else {
//       ungrouped.push(prop);
//     }
//   });

//   return (
//     <div>
//       {ungrouped.map((prop) => (
//         <div key={prop.name} style={{ marginBottom: 12 }}>
//           {prop.content}
//         </div>
//       ))}
//       {Object.keys(groups).map((groupName) => (
//         <div
//           key={groupName}
//           style={{
//             display: "flex",
//             gap: 8,
//             padding: 8,
//             border: "1px solid #ccc",
//             borderRadius: 6,
//             marginBottom: 12
//           }}
//         >
//           {groups[groupName].map((field) => (
//             <div key={field.name} style={{ flex: 1 }}>
//               {field.content}
//             </div>
//           ))}
//         </div>
//       ))}
//     </div>
//   );
// }

