/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import { v4 as uuid } from 'uuid';
import { FormGroup, FormControl, HelpBlock, Glyphicon } from "react-bootstrap";

import FlexBox from "@mapstore/framework/components/layout/FlexBox";
import Message from "@mapstore/framework/components/I18N/Message";
import Button from "@mapstore/framework/components/layout/Button";
import Text from "@mapstore/framework/components/layout/Text";

import { AttributeTypes, getAttributeControlId, parseNumber } from "../utils/CreateDatasetUtils";

const EnumRestriction = ({
    index,
    data = {},
    handleOnChange = () => {},
    getErrorByPath = () => {}
}) => {
    return (
        <FlexBox column wrap gap="sm">
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
                                controlId={getAttributeControlId(data, `option-${option.id}`)}
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
        </FlexBox>
    );
};

export default EnumRestriction;
