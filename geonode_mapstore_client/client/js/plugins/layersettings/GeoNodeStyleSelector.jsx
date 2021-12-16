/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { FormGroup, ControlLabel } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Select from 'react-select';

import { cleanStyles } from '@js/utils/ResourceUtils';

function getStyleOptions(layer) {
    const mapLayerStyles = (layer?.extendedParams?.mapLayer?.extra_params?.styles || [])
        .map((style) => ({ ...style, canEdit: true }));
    const datasetStyles = layer?.extendedParams?.mapLayer?.dataset?.styles || [];
    const defaultStyle = layer?.extendedParams?.mapLayer?.dataset?.default_style;
    const availableStyles = layer?.availableStyles || [];
    return cleanStyles([
        ...(defaultStyle ? [defaultStyle] : []),
        ...datasetStyles,
        ...mapLayerStyles,
        ...availableStyles
    ]).map(({ name, title, canEdit }) => ({
        value: name,
        label: title,
        canEdit
    }));
}

function OptionLabel({
    canEdit,
    label,
    style,
    value,
    buttons = []
}) {
    return (
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', ...style }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
            {buttons.map(({ Component, name }) =>
                <Component
                    key={name}
                    status="LAYER"
                    btnProps={{
                        variant: 'default',
                        className: '',
                        size: ''
                    }}
                    hide={!canEdit}
                    selectedStyle={value}
                />
            )}
        </div>
    );
}

function GeoNodeStyleSelector({
    node,
    onChange,
    buttons
}) {

    const options = getStyleOptions(node);
    const currentStyle = options.find(({ value }) => value === node.style) || { };

    if (!node?.extendedParams?.mapLayer) {
        return null;
    }

    return (

        <FormGroup>
            <ControlLabel><Message msgId="gnviewer.style" /></ControlLabel>
            <Select
                key="style-selector"
                clearable={false}
                options={options.map(({ value, label, canEdit }) => ({
                    value,
                    label: <OptionLabel value={value} label={label} canEdit={canEdit} buttons={buttons}/>
                }))}
                value={{
                    value: node.style,
                    label: <OptionLabel {...currentStyle} style={{ width: 'calc(100% - 16px)' }} buttons={buttons}/>
                }}
                onChange={({ value }) => onChange({ style: value })}/>
        </FormGroup>
    );
}

export default GeoNodeStyleSelector;
