/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import { FormGroup, FormControl, ControlLabel, HelpBlock } from "react-bootstrap";

import FlexBox from "@mapstore/framework/components/layout/FlexBox";
import Message from "@mapstore/framework/components/I18N/Message";

import { getAttributeControlId, parseNumber } from "../utils/CreateDatasetUtils";

const RangeRestriction = ({
    errors = {},
    data = {},
    handleOnChange = () => {},
    disabled
}) => {
    return (
        <FlexBox centerChildrenVertically wrap gap="sm">
            <FlexBox.Fill
                flexBox
                component={FormGroup}
                validationState={errors?.restrictionsRangeMin ? 'error' : undefined}
                controlId={getAttributeControlId(data, 'restrictions-min')}
                centerChildrenVertically
                gap="sm"
            >
                <ControlLabel><Message msgId="gnviewer.min" /></ControlLabel>
                <FormControl
                    type="number"
                    value={data?.restrictionsRangeMin}
                    disabled={disabled}
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
                controlId={getAttributeControlId(data, 'restrictions-max')}
                gap="sm"
                centerChildrenVertically
            >
                <ControlLabel><Message msgId="gnviewer.max" /></ControlLabel>
                <FormControl
                    type="number"
                    value={data?.restrictionsRangeMax}
                    disabled={disabled}
                    onChange={(event) => handleOnChange({
                        restrictionsRangeMax: parseNumber(event.target.value)
                    })}
                />
                {errors?.restrictionsRangeMax
                    ? <HelpBlock>
                        <Message msgId={errors.restrictionsRangeMax} />
                    </HelpBlock> : null}
            </FlexBox.Fill>
        </FlexBox>
    );
};

export default RangeRestriction;
