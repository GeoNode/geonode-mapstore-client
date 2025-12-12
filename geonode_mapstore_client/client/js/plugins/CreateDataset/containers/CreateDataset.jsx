/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import isNil from 'lodash/isNil';
import isString from 'lodash/isString';
import get from 'lodash/get';
import { v4 as uuid } from 'uuid';
import validator from '@rjsf/validator-ajv8';
import axios from '@mapstore/framework/libs/ajax';

import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import { FormGroup, FormControl, ControlLabel, Glyphicon, HelpBlock, Alert } from 'react-bootstrap';
import Button from '@mapstore/framework/components/layout/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import { error } from '@mapstore/framework/actions/notifications';
import { readJson } from '@mapstore/framework/utils/FileUtils';

import {
    AttributeTypes,
    RestrictionsTypes,
    validateSchema,
    validateAttributes,
    getErrorByPath,
    parseJSONSchema,
    DEFAULT_ATTRIBUTE,
    DEFAULT_GEOMETRY_ATTRIBUTE
} from '../utils/CreateDatasetUtils';
import CreateDatasetAttributeRow from '../components/CreateDatasetAttributeRow';
import { createDataset } from '@js/api/geonode/v2';
import { getEndpointUrl, EXECUTION_REQUEST } from '@js/api/geonode/v2/constants';

/**
 * Create Dataset component.
 * It allows to create a new dataset by uploading a JSON schema file or by manually adding attributes.
 * @param {Object} props - The component props
 * @param {Function} props.onError - The function to handle errors
 * @param {number} props.refreshTime - The time in milliseconds to refresh the execution status
 * @ignore
 */
const CreateDataset = ({
    onError = () => {},
    refreshTime = 3000
}) => {
    const inputFile = useRef();
    const [dataset, setDataset] = useState({ ...DEFAULT_ATTRIBUTE });

    const [loading, setLoading] = useState(false);
    const [schemaErrors, setSchemaErrors] = useState([]);
    const [schemaWarnings, setSchemaWarnings] = useState([]);
    const [executionId, setExecutionId] = useState(null);
    const pollingInterval = useRef(null);

    const { errors = [] } = validator.rawValidation(validateSchema, dataset) || {};
    const attributeValidationErrors = validateAttributes(dataset);
    const allErrors = [...errors, ...attributeValidationErrors];

    const tileError = getErrorByPath('/title', allErrors);

    function handleAddAttribute() {
        setDataset(prevDataset => ({
            ...prevDataset,
            attributes: [
                ...prevDataset.attributes,
                {
                    id: uuid(),
                    name: '',
                    type: AttributeTypes.String,
                    restrictionsType: RestrictionsTypes.None,
                    nillable: true
                }
            ]
        }));
    }

    function handleUpdateAttribute(newAttribute) {
        setDataset(prevDataset => ({
            ...prevDataset,
            attributes: prevDataset.attributes
                .map(attribute => attribute.id !== newAttribute.id ? attribute : newAttribute)
        }));
    }

    function handleRemoveAttribute(removeId) {
        setDataset(prevDataset => ({
            ...prevDataset,
            attributes: prevDataset.attributes
                .filter(attribute => attribute.id !== removeId)
        }));
    }

    function handleFileInput(event) {
        const file = get(event, 'target.files[0]');
        if (!file) return;
        readJson(file)
            .then((schema) => {
                const result = parseJSONSchema(schema);
                setSchemaErrors(result.errors);
                setSchemaWarnings(result.warnings);
                if (result.dataset && get(result, 'errors.length', 0) === 0) {
                    setDataset(result.dataset);
                } else {
                    setDataset({ ...DEFAULT_ATTRIBUTE });
                }
            })
            .catch(() => {
                setSchemaErrors(['gnviewer.invalidJSONFile']);
                setSchemaWarnings([]);
            });
        // Reset file input
        event.target.value = '';
    }

    const handleError = useCallback((message) => {
        onError({
            title: "gnviewer.createDatasetErrorTitle",
            message: message || "gnviewer.createDatasetErrorDefault"
        });
    }, [onError]);

    const clearPollingInterval = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    }, []);

    const stopPolling = useCallback((shouldResetLoading = true) => {
        clearPollingInterval();
        if (shouldResetLoading) {
            setLoading(false);
        }
        setExecutionId(null);
    }, [clearPollingInterval]);

    useEffect(() => {
        if (executionId) {
            const pollExecutionStatus = () => {
                axios.get(getEndpointUrl(EXECUTION_REQUEST, `/${executionId}`))
                    .then(({ data }) => {
                        const request = data?.request;
                        const status = request?.status;

                        if (status === 'finished') {
                            const detailUrl = get(request, 'output_params.resources[0].detail_url');
                            stopPolling(false); // Don't reset loading as we're redirecting
                            if (detailUrl) {
                                setLoading(false);
                                window.location.href = detailUrl;
                            }
                        } else if (status === 'failed') {
                            handleError(get(request, 'log'));
                            stopPolling();
                        }
                    })
                    .catch((err) => {
                        handleError(get(err, 'data.detail', get(err, 'originalError.message')));
                        stopPolling();
                    });
            };

            // Start polling immediately and then at intervals
            pollExecutionStatus();
            pollingInterval.current = setInterval(pollExecutionStatus, refreshTime);
        }

        // Cleanup function
        return clearPollingInterval;
    }, [executionId, refreshTime, handleError, stopPolling, clearPollingInterval]);

    function handleCreate() {
        const attributes = dataset.attributes.reduce((acc, attribute) => {
            const restrictionsType = attribute.restrictionsType || RestrictionsTypes.None;
            acc[attribute.name] = {
                type: attribute.type,
                nillable: !!attribute.nillable,
                ...(restrictionsType === RestrictionsTypes.Range && {
                    range: {
                        ...(!isNil(attribute.restrictionsRangeMin) && {
                            min: attribute.restrictionsRangeMin
                        }),
                        ...(!isNil(attribute.restrictionsRangeMax) && {
                            max: attribute.restrictionsRangeMax
                        })
                    }
                }),
                ...(restrictionsType === RestrictionsTypes.Options && {
                    options: (attribute.restrictionsOptions || []).map(option => option.value)
                })
            };
            return acc;
        }, {});

        setLoading(true);
        createDataset({
            action: "create",
            title: dataset.title,
            geom: dataset.geometry_type,
            attributes: attributes
        })
            .then((data) => {
                if (data?.error) {
                    handleError(data.error);
                    setLoading(false);
                    return;
                }
                if (data?.execution_id) {
                    // Start polling for execution status
                    setExecutionId(data.execution_id);
                }
            })
            .catch((err) => {
                const errorMessage = get(err, 'data.detail')
                    || get(err, 'data.message')
                    || get(err, 'originalError.message');
                handleError(errorMessage);
                setLoading(false);
            });
    }

    return (
        <FlexBox
            classNames={[
                'gn-create-dataset',
                'ms-main-colors',
                '_fill',
                '_absolute',
                '_padding-lr-md'
            ]}
        >
            <FlexBox
                column
                classNames={[
                    'gn-create-dataset-container',
                    '_fill',
                    '_relative',
                    '_padding-tb-sm'
                ]}
                gap="sm"
            >
                <Text fontSize="xl">
                    <Message msgId="gnviewer.createAnEmptyDataset" />
                </Text>
                <FormGroup
                    controlId="datasetTitle"
                    validationState={tileError ? 'error' : undefined}>
                    <ControlLabel><Message msgId="gnviewer.datasetTitle" /></ControlLabel>
                    <FormControl
                        type="text"
                        autoComplete="off"
                        value={dataset?.title}
                        disabled={loading}
                        onChange={(event) =>
                            setDataset({
                                ...dataset,
                                title: event.target.value
                            })
                        }
                    />
                    {tileError ? <HelpBlock><Message msgId={tileError} /></HelpBlock> : null}
                </FormGroup>
                <FlexBox column gap="sm" classNames={[
                    '_padding-t-lg',
                    '_padding-r-sm',
                    '_overflow-auto']}
                >
                    <FlexBox.Fill flexBox className="gn-attributes-header">
                        <FlexBox component="div">
                            <Text fontSize="lg">
                                <Message msgId="gnviewer.attributes" />
                            </Text>
                        </FlexBox>
                        <FlexBox gap="sm">
                            {(schemaErrors.length > 0 || schemaWarnings.length > 0) && (
                                <Button variant="default" disabled={loading} onClick={() => {setSchemaErrors([]); setSchemaWarnings([]);}}>
                                    <Message msgId="gnviewer.clearWarnings" />
                                </Button>
                            )}
                            <div>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileInput}
                                    ref={inputFile}
                                    disabled={loading}
                                    style={{ display: 'none' }}
                                />
                                <Button variant="primary" disabled={loading} onClick={() => inputFile?.current?.click()}>
                                    <Message msgId="gnviewer.loadAttributesFromJSONSchema" />
                                </Button>
                            </div>
                        </FlexBox>
                    </FlexBox.Fill>
                    {(schemaErrors.length > 0 || schemaWarnings.length > 0) && (
                        <FlexBox column classNames={['gn-attributes-warnings', '_padding-t-sm']}>
                            {schemaErrors.map((_error, index) => (
                                <Alert bsStyle="danger" key={index}>
                                    <Message msgId={_error} />
                                </Alert>
                            ))}
                            {schemaWarnings.map((warning, index) => (
                                <Alert bsStyle="warning" key={index}>
                                    <Message
                                        msgId={isString(warning) ? warning : warning.msgId}
                                        msgParams={warning.msgParams} />
                                </Alert>
                            ))}
                        </FlexBox>
                    )}
                    <table className="table">
                        <thead>
                            <tr>
                                <th><Message msgId="gnviewer.name" /></th>
                                <th><Message msgId="gnviewer.type" /></th>
                                <th><Message msgId="gnviewer.nillable" /></th>
                                <th><Message msgId="gnviewer.restrictions" /></th>
                                <th></th> {/* action buttons */}
                            </tr>
                        </thead>
                        <tbody>
                            <CreateDatasetAttributeRow
                                data={{
                                    ...DEFAULT_GEOMETRY_ATTRIBUTE,
                                    type: dataset.geometry_type
                                }}
                                onChange={(geometry) => {
                                    setDataset({
                                        ...dataset,
                                        geometry_type: geometry.type
                                    });
                                }}
                                geometryAttribute
                                disabled={loading}
                            />
                            {dataset.attributes.map((attribute, idx) => {
                                return (
                                    <CreateDatasetAttributeRow
                                        key={attribute.id}
                                        index={idx}
                                        data={attribute}
                                        getErrorByPath={(path) => getErrorByPath(path, allErrors)}
                                        tools={
                                            <Button
                                                className="square-button-md"
                                                disabled={loading}
                                                onClick={() =>
                                                    handleRemoveAttribute(attribute.id)
                                                }
                                            >
                                                <Glyphicon glyph="trash"/>
                                            </Button>
                                        }
                                        onChange={handleUpdateAttribute}
                                        disabled={loading}
                                    />
                                );
                            })}
                            <tr>
                                <td colSpan={4}>
                                    <Button className="gn-attribute-button" size="sm" disabled={loading} onClick={handleAddAttribute}>
                                        <Glyphicon glyph="plus"/>
                                        <Message msgId="gnviewer.addAttribute" />
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </FlexBox>

                <FlexBox centerChildrenVertically gap="sm">
                    <Button
                        className="gn-attribute-button"
                        variant="success"
                        disabled={!!allErrors.length || loading}
                        onClick={handleCreate}>
                        <Message msgId="gnviewer.createNewDataset" />
                    </Button>
                    {loading ? <Spinner /> : null}
                </FlexBox>
            </FlexBox>
        </FlexBox>
    );
};

export default connect(null, { onError: error })(CreateDataset);
