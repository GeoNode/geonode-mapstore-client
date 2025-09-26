/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useRef, useState } from 'react';
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

/**
 * Create Dataset component.
 * It allows to create a new dataset by uploading a JSON schema file or by manually adding attributes.
 * @param {Object} props - The component props
 * @param {Function} props.onError - The function to handle errors
 */
const CreateDataset = ({
    onError = () => {}
}) => {
    const inputFile = useRef();
    const [dataset, setDataset] = useState({ ...DEFAULT_ATTRIBUTE });

    const [loading, setLoading] = useState(false);
    const [schemaErrors, setSchemaErrors] = useState([]);
    const [schemaWarnings, setSchemaWarnings] = useState([]);

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

    const handleError = (message) => {
        onError({
            title: "gnviewer.createDatasetErrorTitle",
            message: message || "gnviewer.createDatasetErrorDefault"
        });
    };

    function handleCreate() {
        const formData = new FormData();
        formData.append('title', dataset.title);
        formData.append('geometry_type', dataset.geometry_type);
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
        formData.append('attributes', JSON.stringify(attributes));
        axios.post('/createlayer/?f=json', formData)
            .then((response) => {
                if (response?.data?.error) {
                    handleError();
                    return;
                }
                if (response?.data?.detail_url) {
                    window.location.href = response.data.detail_url;
                }
            })
            .catch((err) => {
                handleError(get(err, 'data.detail', get(err, 'originalError.message', get(err, 'message'))));
            })
            .finally(() => setLoading(false));
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
                                <Button variant="default" onClick={() => {setSchemaErrors([]); setSchemaWarnings([]);}}>
                                    <Message msgId="gnviewer.clearWarnings" />
                                </Button>
                            )}
                            <div>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileInput}
                                    ref={inputFile}
                                    style={{ display: 'none' }}
                                />
                                <Button variant="primary" onClick={() => inputFile?.current?.click()}>
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
                                                onClick={() =>
                                                    handleRemoveAttribute(attribute.id)
                                                }
                                            >
                                                <Glyphicon glyph="trash"/>
                                            </Button>
                                        }
                                        onChange={handleUpdateAttribute}
                                    />
                                );
                            })}
                            <tr>
                                <td colSpan={4}>
                                    <Button className="gn-attribute-button" size="sm" onClick={handleAddAttribute}>
                                        <Glyphicon glyph="plus"/>
                                        <Message msgId="gnviewer.addAttribute" />
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </FlexBox>

                <div>
                    <Button
                        className="gn-attribute-button"
                        variant="success"
                        disabled={!!allErrors.length || loading}
                        onClick={handleCreate}>
                        <Message msgId="gnviewer.createNewDataset" />
                        {loading ? <Spinner /> : null}
                    </Button>
                </div>
            </FlexBox>
        </FlexBox>
    );
};

export default connect(null, { onError: error })(CreateDataset);
