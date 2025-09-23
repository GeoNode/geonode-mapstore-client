/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { isNil } from 'lodash';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import { FormGroup, FormControl, ControlLabel, Glyphicon, HelpBlock } from 'react-bootstrap';
import Button from '@mapstore/framework/components/layout/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import { v4 as uuid } from 'uuid';
import validator from '@rjsf/validator-ajv8';
import axios from '@mapstore/framework/libs/ajax';
import {
    AttributeTypes,
    RestrictionsTypes,
    validateSchema,
    validateAttributes,
    getErrorByPath,
    DEFAULT_ATTRIBUTE,
    DEFAULT_GEOMETRY_ATTRIBUTE
} from '../utils/CreateDatasetUtils';
import CreateDatasetAttributeRow from '../components/CreateDatasetAttributeRow';
import Spinner from '@mapstore/framework/components/layout/Spinner';

const CreateDataset = () => {

    const [dataset, setDataset] = useState({ ...DEFAULT_ATTRIBUTE });

    const [loading, setLoading] = useState(false);

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
                if (response?.data?.detail_url) {
                    window.location.href = response.data.detail_url;
                }
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
                <FlexBox gap="sm" classNames={['_padding-t-lg']}>
                    <FlexBox.Fill>
                        <Text fontSize="lg">
                            <Message msgId="gnviewer.attributes" />
                        </Text>
                    </FlexBox.Fill>
                    <Button variant="primary">
                        <Message msgId="gnviewer.loadAttributesFromJSONSchema" />
                    </Button>
                </FlexBox>
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
                                <Button size="sm" onClick={handleAddAttribute}>
                                    <Glyphicon glyph="plus"/>
                                    {' '}<Message msgId="gnviewer.addAttribute" />
                                </Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div>
                    <Button
                        variant="success"
                        disabled={!!allErrors.length || loading}
                        onClick={handleCreate}>
                        <Message msgId="gnviewer.createNewDataset" />
                        {loading ? <>{' '}<Spinner /></> : null}
                    </Button>
                </div>
            </FlexBox>
        </FlexBox>
    );
};

export default CreateDataset;
