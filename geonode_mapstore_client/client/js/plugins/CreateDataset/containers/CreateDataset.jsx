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
import uuid from 'uuid/v1';
import validator from '@rjsf/validator-ajv8';
import axios from '@mapstore/framework/libs/ajax';
import { AttributeTypes, RestrictionsTypes, validateSchema } from '../utils/CreateDatasetUtils';
import CreateDatasetAttributeRow from '../components/CreateDatasetAttributeRow';
import Spinner from '@mapstore/framework/components/layout/Spinner';

const CreateDataset = ({}) => {

    const [dataset, setDataset] = useState({
        name: '',
        title: '',
        geometry_type: AttributeTypes.Point,
        attributes: []
    });

    const [loading, setLoading] = useState(false);

    const { errors = [] } = validator.rawValidation(validateSchema, dataset) || {};

    const getErrorByPath = (path) => {
        const error = errors.find(err => err.instancePath === path);
        return error?.message;
    };

    const tileError = getErrorByPath('/title');

    function handleAddAttribute() {
        setDataset(prevDataset => ({
            ...prevDataset,
            attributes: [
                ...prevDataset.attributes,
                {
                    id: uuid(),
                    name: '',
                    type: AttributeTypes.String,
                    restrictionsType: 'none',
                    nillable: true
                }
            ]
        }));
    }

    function handleUpdateAttribute(newAttribute) {
        setDataset(prevDataset => ({
            ...prevDataset,
            attributes: prevDataset.attributes.map(attribute => attribute.id !== newAttribute.id ? attribute : newAttribute)
        }));
    }

    function handleRemoveAttribute(removeId) {
        setDataset(prevDataset => ({
            ...prevDataset,
            attributes: prevDataset.attributes.filter(attribute => attribute.id !== removeId)
        }));
    }

    function handleCreate() {
        const formData = new FormData();
        formData.append('name', dataset.name);
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
        <FlexBox className="gn-create-dataset"  classNames={['ms-main-colors', '_fill', '_absolute', '_padding-lr-md']} style={{ overflow: 'auto' }}>
            <FlexBox column classNames={['_fill', '_relative', '_padding-tb-sm']} gap="sm" style={{ maxWidth: 1440, margin: 'auto', width: '100%' }}>
                <Text fontSize="xl">
                    <Message msgId="gnviewer.createAnEmptyDataset" />
                </Text>
                <FormGroup controlId="datasetTitle" validationState={tileError ? "error" : undefined}>
                    <ControlLabel><Message msgId="gnviewer.datasetTitle" /></ControlLabel>
                    <FormControl type="text" autocomplete="off" value={dataset?.title} onChange={(event) => setDataset({ ...dataset, title: event.target.value })} />
                    {tileError ? <HelpBlock>{tileError}</HelpBlock> : null}
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
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <CreateDatasetAttributeRow
                            data={{
                                id: 'geom',
                                name: 'geom',
                                type: dataset.geometry_type,
                                restrictionsType: RestrictionsTypes.None,
                                nillable: false
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
                                    getErrorByPath={getErrorByPath}
                                    tools={
                                        <Button className="square-button-md" onClick={() => handleRemoveAttribute(attribute.id)}>
                                            <Glyphicon glyph="trash"/>
                                        </Button>
                                    }
                                    onChange={handleUpdateAttribute}
                                />
                            );
                        })}
                        <tr>
                            <td>
                                <Button size="sm" onClick={handleAddAttribute}>
                                    <Glyphicon glyph="plus"/>
                                    {' '}<Message msgId="gnviewer.addAttribute" />
                                </Button>
                            </td>
                            <td/>
                            <td/>
                            <td/>
                        </tr>
                    </tbody>
                </table>
                <div>
                    <Button
                        variant="success"
                        disabled={!!errors.length || loading}
                        onClick={handleCreate}>
                        <Message msgId="gnviewer.createNewDataset" />{loading ? <>{' '}<Spinner /></> : null}
                    </Button>
                </div>
            </FlexBox>
        </FlexBox>
    );
};

export default CreateDataset;
