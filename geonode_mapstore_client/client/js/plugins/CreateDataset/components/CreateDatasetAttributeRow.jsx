/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, FormControl, Checkbox, HelpBlock } from 'react-bootstrap';

import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Message from '@mapstore/framework/components/I18N/Message';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';

import { AttributeTypes, getAttributeControlId, RestrictionsTypes } from '../utils/CreateDatasetUtils';
import RangeRestriction from './RangeRestriction';
import EnumRestriction from './EnumRestriction';

const CreateDatasetAttributeRow = ({
    data,
    geometryAttribute,
    disabled,
    tools,
    onChange,
    getErrorByPath = () => undefined,
    index
}, context) => {

    const errors = {
        name: getErrorByPath(`/attributes/${index}/name`),
        restrictionsType: getErrorByPath(`/attributes/${index}/restrictionsType`),
        restrictionsRangeMin: getErrorByPath(`/attributes/${index}/restrictionsRangeMin`),
        restrictionsRangeMax: getErrorByPath(`/attributes/${index}/restrictionsRangeMax`)
    };

    const typesOptions = geometryAttribute
        ? [
            { value: AttributeTypes.Point, labelId: 'gnviewer.points' },
            { value: AttributeTypes.LineString, labelId: 'gnviewer.lines' },
            { value: AttributeTypes.Polygon, labelId: 'gnviewer.polygons' }]
        : [
            { value: AttributeTypes.String, labelId: 'gnviewer.string' },
            { value: AttributeTypes.Integer, labelId: 'gnviewer.integer' },
            { value: AttributeTypes.Float, labelId: 'gnviewer.float' },
            { value: AttributeTypes.Date, labelId: 'gnviewer.date' }
        ];

    const restrictionsOptions = [
        AttributeTypes.Integer,
        AttributeTypes.Float,
        AttributeTypes.String
    ].includes(data?.type)
        ? [
            { value: RestrictionsTypes.None, labelId: 'gnviewer.none' },
            ...(data?.type !== AttributeTypes.String
                ? [{ value: RestrictionsTypes.Range, labelId: 'gnviewer.range' }]
                : []
            ),
            { value: RestrictionsTypes.Options, labelId: 'gnviewer.options' }
        ]
        : [{ value: RestrictionsTypes.None, labelId: 'gnviewer.none' }];

    function handleOnChange(properties) {
        onChange({
            ...data,
            ...properties
        });
    }

    function handleTypeChange(event) {
        const newType = event.target.value;
        const currentType = data?.type;

        // If type is changing, clear restrictions and set to default
        if (newType !== currentType) {
            onChange({
                ...data,
                type: newType,
                restrictionsType: RestrictionsTypes.None,
                restrictionsRangeMin: null,
                restrictionsRangeMax: null,
                restrictionsOptions: []
            });
        } else {
            handleOnChange({ type: newType });
        }
    }

    return (
        <tr className="gn-dataset-attribute">
            <td className="gn-attribute-name">
                <FormGroup
                    controlId={getAttributeControlId(data, 'name')}
                    validationState={errors?.name ? 'error' : undefined}
                >
                    <FormControl
                        type="text"
                        value={data?.name || ''}
                        disabled={!!geometryAttribute || disabled}
                        onChange={(event) => handleOnChange({ name: event.target.value })}
                    />
                    {errors?.name ? <HelpBlock><Message msgId={errors.name} /></HelpBlock> : null}
                </FormGroup>
            </td>
            <td className="gn-attribute-type">
                <FormGroup controlId={getAttributeControlId(data, 'type')}>
                    <FormControl
                        value={data?.type || ''}
                        componentClass="select"
                        placeholder="select"
                        onChange={handleTypeChange}
                        disabled={disabled}
                    >
                        {typesOptions.map(({ labelId, value }) =>
                            <option key={value} value={value}>
                                {getMessageById(context.messages, labelId)}
                            </option>
                        )}
                    </FormControl>
                </FormGroup>
            </td>
            <td className="gn-attribute-nillable">
                <FormGroup controlId={getAttributeControlId(data, 'nillable')}>
                    <Checkbox
                        style={{ paddingTop: 6 }}
                        checked={!!data?.nillable}
                        disabled={!!geometryAttribute || disabled}
                        onChange={(event) =>
                            handleOnChange({ nillable: event.target.checked })
                        }
                    />
                </FormGroup>
            </td>
            <td>
                <FlexBox column gap="sm">
                    <FormGroup
                        controlId={getAttributeControlId(data, 'restrictions')}
                        validationState={errors?.restrictionsType ? 'error' : undefined}>
                        <FormControl
                            value={data?.restrictionsType}
                            componentClass="select"
                            placeholder="select"
                            disabled={!!geometryAttribute || disabled}
                            onChange={(event) =>
                                handleOnChange({ restrictionsType: event.target.value })
                            }
                        >
                            {restrictionsOptions.map(({ labelId, value }) =>
                                <option key={value} value={value}>
                                    {getMessageById(context.messages, labelId)}
                                </option>
                            )}
                        </FormControl>
                        {errors?.restrictionsType ? <HelpBlock>{errors.restrictionsType}</HelpBlock> : null}
                    </FormGroup>
                    {data?.restrictionsType === RestrictionsTypes.Range ?
                        <RangeRestriction
                            errors={errors}
                            data={data}
                            handleOnChange={handleOnChange}
                            disabled={disabled}
                        /> : null}
                    {data?.restrictionsType === RestrictionsTypes.Options
                        ? <EnumRestriction
                            index={index}
                            data={data}
                            handleOnChange={handleOnChange}
                            getErrorByPath={getErrorByPath}
                            disabled={disabled}
                        /> : null}
                </FlexBox>
            </td>
            <td className="gn-attribute-tools">
                {tools}
            </td>
        </tr>
    );
};

CreateDatasetAttributeRow.contextTypes = {
    messages: PropTypes.object
};

export default CreateDatasetAttributeRow;
