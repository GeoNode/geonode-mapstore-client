/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { connect } from 'react-redux';
import {
    toggleControl,
    setControlProperty
} from '@mapstore/framework/actions/controls';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';

/**
 * buttons override to use in ActionNavbar for plugin imported from mapstore
 */

export const PrintActionButton = connect(
    () => ({}),
    { onClick: toggleControl.bind(null, 'print', null) }
)(({
    onClick,
    variant,
    size
}) => {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="printbutton"/>
        </Button>
    );
});

export const CatalogActionButton = connect(
    () => ({}),
    { onClick: setControlProperty.bind(null, 'metadataexplorer', 'enabled', true, true) }
)(({
    onClick,
    variant,
    size
}) => {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="catalog.title"/>
        </Button>
    );
});

export const MeasureActionButton = connect(
    () => ({}),
    { onClick: setControlProperty.bind(null, 'measure', 'enabled', true) }
)(({
    onClick,
    variant,
    size
}) => {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="measureComponent.Measure"/>
        </Button>
    );
});

export const LayerDownloadActionButton = connect(
    () => ({}),
    { onClick: setControlProperty.bind(null, 'layerdownload', 'enabled', true, true) }
)(({
    onClick,
    variant,
    size
}) => {
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="layerdownload.title"/>
        </Button>
    );
});
