/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import clamp from 'lodash/clamp';
import { FormGroup, ControlLabel } from 'react-bootstrap';
import VisibilityLimitsForm from '@mapstore/framework/components/TOC/fragments/settings/VisibilityLimitsForm';
import IntlNumberFormControl from '@mapstore/framework/components/I18N/IntlNumberFormControl';
import Message from '@mapstore/framework/components/I18N/Message';

function VisibilitySettings({
    node = {},
    resolutions,
    projection,
    onChange = () => {},
    zoom
}) {
    const {
        opacity = 1.0
    } = node;
    return (
        <>
            <FormGroup>
                <ControlLabel><Message msgId="opacity"/> %</ControlLabel>
                <IntlNumberFormControl
                    type="number"
                    min={0}
                    max={100}
                    name="opacity"
                    value={opacity * 100}
                    onChange={(value)=> onChange({ opacity: clamp(Math.round(value), 0, 100) / 100 })}/>
            </FormGroup>
            <FormGroup>
                <VisibilityLimitsForm
                    title={<ControlLabel><Message msgId="layerProperties.visibilityLimits.title"/></ControlLabel>}
                    layer={node}
                    onChange={(newProperty) => onChange(newProperty)}
                    projection={projection}
                    resolutions={resolutions}
                    zoom={zoom}
                />
            </FormGroup>
        </>
    );
}

export default VisibilitySettings;
