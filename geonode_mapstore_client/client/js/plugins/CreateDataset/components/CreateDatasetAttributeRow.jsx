/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import { FormGroup, FormControl, ControlLabel, Checkbox, Glyphicon, HelpBlock } from 'react-bootstrap';
import Button from '@mapstore/framework/components/layout/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import uuid from 'uuid/v1';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import { AttributeTypes, RestrictionsTypes } from '../utils/CreateDatasetUtils';

const parseNumber = (value) => {
    if (value === '') {
        return null;
    }
    return parseFloat(value);
};

const CreateDatasetAttributeRow = ({
    data,
    geometryAttribute,
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

    const getControlId = (suffix) => `attribute-${data?.id}-${suffix}`;

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
                    controlId={getControlId('name')}
                    validationState={errors?.name ? 'error' : undefined}
                >
                    <FormControl
                        type="text"
                        value={data?.name || ''}
                        disabled={!!geometryAttribute}
                        onChange={(event) => handleOnChange({ name: event.target.value })}
                    />
                    {errors?.name ? <HelpBlock><Message msgId={errors.name} /></HelpBlock> : null}
                </FormGroup>
            </td>
            <td className="gn-attribute-type">
                <FormGroup controlId={getControlId('type')}>
                    <FormControl
                        value={data?.type || ''}
                        componentClass="select"
                        placeholder="select"
                        onChange={handleTypeChange}
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
                <FormGroup controlId={getControlId('nillable')}>
                    <Checkbox
                        style={{ paddingTop: 6 }}
                        checked={!!data?.nillable}
                        disabled={!!geometryAttribute}
                        onChange={(event) =>
                            handleOnChange({ nillable: event.target.checked })
                        }
                    />
                </FormGroup>
            </td>
            <td>
                <FlexBox column gap="sm">
                    <FormGroup
                        controlId={getControlId('restrictions')}
                        validationState={errors?.restrictionsType ? 'error' : undefined}>
                        <FormControl
                            value={data?.restrictionsType}
                            componentClass="select"
                            placeholder="select"
                            disabled={!!geometryAttribute}
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
                        <FlexBox centerChildrenVertically wrap gap="sm">
                            <FlexBox.Fill
                                flexBox
                                component={FormGroup}
                                validationState={errors?.restrictionsRangeMin ? 'error' : undefined}
                                controlId={getControlId('restrictions-min')}
                                centerChildrenVertically
                                gap="sm"
                            >
                                <ControlLabel><Message msgId="gnviewer.min" /></ControlLabel>
                                <FormControl
                                    type="number"
                                    value={data?.restrictionsRangeMin}
                                    onChange={(event) => handleOnChange({
                                        restrictionsRangeMin: parseNumber(event.target.value)
                                    })}
                                />
                                {errors?.restrictionsRangeMin ?
                                    <HelpBlock>
                                        <Message msgId={errors.restrictionsRangeMin} />
                                    </HelpBlock> : null}
                            </FlexBox.Fill>
                            <FlexBox.Fill
                                flexBox
                                component={FormGroup}
                                validationState={errors?.restrictionsRangeMax ? 'error' : undefined}
                                controlId={getControlId('restrictions-max')}
                                gap="sm"
                                centerChildrenVertically
                            >
                                <ControlLabel><Message msgId="gnviewer.max" /></ControlLabel>
                                <FormControl
                                    type="number"
                                    value={data?.restrictionsRangeMax}
                                    onChange={(event) => handleOnChange({
                                        restrictionsRangeMax: parseNumber(event.target.value)
                                    })}
                                />
                                {errors?.restrictionsRangeMax
                                    ? <HelpBlock>
                                        <Message msgId={errors.restrictionsRangeMax} />
                                    </HelpBlock> : null}
                            </FlexBox.Fill>
                        </FlexBox> : null}
                    {data?.restrictionsType === RestrictionsTypes.Options
                        ? <FlexBox column wrap gap="sm">
                            <FlexBox gap="sm" column component="ul">
                                {(data?.restrictionsOptions || []).map((option, idx) => {
                                    const optionsError = {
                                        value: getErrorByPath(`/attributes/${index}/restrictionsOptions/${idx}/value`)
                                    };
                                    return (
                                        <FlexBox component="li" gap="sm" key={option.id}>
                                            <Text style={{ paddingTop: 6 }}>●</Text>
                                            <FlexBox.Fill
                                                component={FormGroup}
                                                key={option.id}
                                                validationState={optionsError?.value ? 'error' : undefined}
                                                controlId={getControlId(`option-${option.id}`)}
                                            >
                                                <FormControl
                                                    type={data?.type === AttributeTypes.String ? "text" : "number"}
                                                    value={option.value}
                                                    onChange={(event) => handleOnChange({
                                                        restrictionsOptions: (data?.restrictionsOptions || [])
                                                            .map((opt) => {
                                                                return opt.id !== option.id
                                                                    ? opt : {
                                                                        ...option,
                                                                        value: data?.type === AttributeTypes.String
                                                                            ? event.target.value
                                                                            : parseNumber(event.target.value)
                                                                    };
                                                            })
                                                    })}
                                                />
                                                {optionsError?.value ? <HelpBlock>
                                                    <Message msgId={optionsError.value} />
                                                </HelpBlock> : null}
                                            </FlexBox.Fill>
                                            <Button square
                                                onClick={() => handleOnChange({
                                                    restrictionsOptions: (data?.restrictionsOptions || [])
                                                        .filter(opt => opt.id !== option.id)
                                                })}>
                                                <Glyphicon glyph="trash" />
                                            </Button>
                                        </FlexBox>
                                    );
                                })}
                                <div>
                                    <Button size="sm" onClick={() => handleOnChange({
                                        restrictionsOptions: [
                                            ...(data?.restrictionsOptions || []),
                                            {
                                                id: uuid(),
                                                value: ''
                                            }
                                        ]
                                    })}>
                                        <Glyphicon glyph="plus" />
                                        <Message msgId="gnviewer.addOption" />
                                    </Button>
                                </div>
                            </FlexBox>
                        </FlexBox> : null}
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
