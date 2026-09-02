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
import { Alert } from 'react-bootstrap';
import isEmpty from 'lodash/isEmpty';

import { getMetadataByPk } from '@js/api/geonode/v2/metadata';
import widgets from '../components/_widgets';
import templates from '../components/_templates';
import fields from '../components/_fields';
import MainEventView from '@js/components/MainEventView';
import MainLoader from '@js/components/MainLoader';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';

const metadataMsIdById = {
    root_uuid: 'metadata-edit-uuid',
    root_title: 'metadata-edit-title',
    root_abstract: 'metadata-edit-abstract',
    root_date: 'metadata-edit-date',
    root_date_type: 'metadata-edit-publication-type',
    root_category: 'metadata-edit-category',
    root_hkeywords: 'metadata-edit-keywords',
    root_language: 'metadata-edit-language',
    root_license: 'metadata-edit-license',
    root_attribution: 'metadata-edit-attribution',
    root_regions: 'metadata-edit-regions',
    root_data_quality_statement: 'metadata-edit-dqs',
    root_restriction_code_type: 'metadata-edit-restrictions',
    root_constraints_other: 'metadata-edit-constraints',
    root_edition: 'metadata-edit-edition',
    root_doi: 'metadata-edit-doi',
    root_purpose: 'metadata-edit-purpose',
    root_supplemental_information: 'metadata-edit-supplemental-information',
    root_temporal_extent_start: 'metadata-edit-temporal-extent-start',
    root_temporal_extent_end: 'metadata-edit-temporal-extent-end',
    root_maintenance_frequency: 'metadata-edit-maintenance-frequency',
    root_spatial_representation_type: 'metadata-edit-representation-type',
    root_linkedresources: 'metadata-edit-related',
    root_contacts: 'metadata-edit-contacts',
    root_contacts_owner: 'metadata-edit-contacts-owner',
    root_contacts_author: 'metadata-edit-contacts-metadata',
    root_contacts_processor: 'metadata-edit-contacts-processor',
    root_contacts_publisher: 'metadata-edit-contacts-publisher',
    root_contacts_custodian: 'metadata-edit-contacts-custodian',
    root_contacts_pointOfContact: 'metadata-edit-contacts-poc',
    root_contacts_distributor: 'metadata-edit-contacts-distributor',
    root_contacts_resource_user: 'metadata-edit-contacts-resource-user',
    root_contacts_resource_provider: 'metadata-edit-contacts-resource-provider',
    root_contacts_originator: 'metadata-edit-contacts-originator',
    root_contacts_principal_investigator: 'metadata-edit-contacts-investigator',
    root_is_published: 'metadata-edit-published'
};

function applyMetadataMsIdTags() {
    Object.entries(metadataMsIdById).forEach(([id, cyData]) => {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute('data-ms-id', cyData);
        }
    });
}

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

    useEffect(() => {
        if (loading || error) {
            return;
        }
        applyMetadataMsIdTags();
    }, [loading, error, metadata, schema, uiSchema, updating]);

    function handleChange(formData) {
        setUpdateError(null);
        setMetadata(formData);
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

    return (
        <div className="gn-metadata" data-ms-id="metadata-editor-form">
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
                        title: metadata?.title,
                        metadata,
                        capitalizeTitle: capitalizeFieldTitle
                    }}
                    schema={schema}
                    widgets={widgets}
                    uiSchema={uiSchema}
                    formData={metadata}
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
