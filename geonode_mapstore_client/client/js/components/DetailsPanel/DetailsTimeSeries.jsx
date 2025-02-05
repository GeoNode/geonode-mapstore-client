/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import PropTypes from "prop-types";
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import { Checkbox, FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap';
import Select from 'react-select';
import Message from '@mapstore/framework/components/I18N/Message';
import HTML from '@mapstore/framework/components/I18N/HTML';
import { TIME_SERIES_PROPERTIES, TIME_ATTRIBUTE_TYPES, TIME_PRECISION_STEPS } from '@js/utils/ResourceUtils';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import InfoPopover from '@mapstore/framework/components/widgets/widget/InfoPopover';

const TimeSeriesSettings = ({ resource, onChange }, context) => {
    const timeAttributes = (resource?.attribute_set ?? [])
        .filter((attribute) => TIME_ATTRIBUTE_TYPES.includes(attribute.attribute_type))
        .map((attribute)=> ({value: attribute.pk, label: attribute.attribute}));

    if (isEmpty(timeAttributes)) return null;
    const [timeseries, setTimeSeries] = useState(resource.timeseries);
    const [error, setError] = useState();

    const onChangeTimeSettings = (key, value) => {
        const _timeseries = {
            ...timeseries,
            [key]: value,
            ...(key === "presentation"
                ? value === "LIST"
                    // reset precision field when presentation is LIST
                    ? {precision_value: undefined, precision_step: undefined}
                    : {precision_value: null, precision_step: "seconds"} : undefined
            ),
            ...(key === "has_time"
                ? !value
                    // reset all time series properties when has_time is `false`
                    ? TIME_SERIES_PROPERTIES.reduce((obj, prop) => ({...obj, [prop]: undefined}), {})
                    : { presentation: "LIST"} : undefined
            )
        };
        const isFormInValid = _timeseries.has_time ? isNil(_timeseries.attribute) && isNil(_timeseries.end_attribute) : false;
        setTimeSeries(_timeseries);
        setError(isFormInValid);
        if (!isFormInValid) {
            // update resource when timeseries is changed and valid
            onChange({timeseries: _timeseries}, "timeseries");
        }
    };

    const attributeFields = ['attribute', 'end_attribute'];
    const hasTime = !!timeseries?.has_time;
    return (
        <>
            <div className="gn-details-info-row gn-details-flex-field">
                <Message msgId={"gnviewer.timeSeriesSetting.title"} />
                <InfoPopover
                    glyph="info-sign"
                    placement="right"
                    title={<Message msgId="gnviewer.timeSeriesSetting.additionalHelp" />}
                    popoverStyle={{ maxWidth: 500 }}
                    text={<HTML msgId="gnviewer.timeSeriesSetting.helpText"/>}
                />
            </div>
            <div className="gn-details-info-row gn-details-flex-field">
                <Checkbox
                    style={{ margin: 0 }}
                    checked={hasTime}
                    onChange={(event) => onChangeTimeSettings('has_time', !!event.target.checked)}
                >
                    <Message msgId={"gnviewer.timeSeriesSetting.hasTime"}/>
                </Checkbox>
            </div>
            {hasTime && <div className="gn-time-settings-form">
                <div className="gn-details-info-row gn-details-flex-field">
                    {attributeFields.map((attributeField, index) => (
                        <FormGroup validationState={error ? "error" : null} >
                            <ControlLabel><Message msgId={`gnviewer.timeSeriesSetting.${attributeField}`} /></ControlLabel>
                            <Select
                                fullWidth={false}
                                clearable={false}
                                key={`time-attribute-${index}`}
                                options={timeAttributes}
                                value={timeseries[attributeField]}
                                onChange={({ value } = {}) => onChangeTimeSettings(attributeField, value)}
                            />
                            {error && <HelpBlock><Message msgId="gnviewer.timeSeriesSetting.helpTextAttribute"/></HelpBlock>}
                        </FormGroup>)
                    )}
                </div>
                <div className="gn-details-info-row gn-details-flex-field">
                    <FormGroup>
                        <ControlLabel><Message msgId="gnviewer.timeSeriesSetting.presentation" /></ControlLabel>
                        <Select
                            fullWidth={false}
                            clearable={false}
                            key="presentation-dropdown"
                            options={[
                                {value: "LIST", label: getMessageById(context.messages, "gnviewer.timeSeriesSetting.list") },
                                {value: "DISCRETE_INTERVAL", label: getMessageById(context.messages, "gnviewer.timeSeriesSetting.discreteInterval") },
                                {value: "CONTINUOUS_INTERVAL", label: getMessageById(context.messages, "gnviewer.timeSeriesSetting.continuousInterval") }
                            ]}
                            value={timeseries.presentation}
                            onChange={({ value } = {}) => onChangeTimeSettings("presentation", value)}
                        />
                    </FormGroup>
                </div>
                {timeseries?.presentation && timeseries?.presentation !== "LIST" && <div className="gn-details-info-row gn-details-flex-field">
                    <FormGroup>
                        <ControlLabel><Message msgId="gnviewer.timeSeriesSetting.precisionValue" /></ControlLabel>
                        <FormControl
                            type="number"
                            value={timeseries.precision_value}
                            onChange={(event) => {
                                let value = event.target.value;
                                value = value ? Number(value) : null;
                                onChangeTimeSettings("precision_value", value);
                            }} />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel><Message msgId="gnviewer.timeSeriesSetting.precisionStep" /></ControlLabel>
                        <Select
                            fullWidth={false}
                            clearable={false}
                            key="precision-step-dropdown"
                            options={TIME_PRECISION_STEPS.map(precisionStep=> (
                                {value: precisionStep, label: getMessageById(context.messages, `gnviewer.timeSeriesSetting.${precisionStep}`) }
                            ))}
                            value={timeseries.precision_step}
                            onChange={({ value } = {}) => onChangeTimeSettings("precision_step", value)}
                        />
                    </FormGroup>
                </div>}
            </div>}
        </>
    );
};

TimeSeriesSettings.contextTypes = {
    messages: PropTypes.object
};

export default TimeSeriesSettings;
