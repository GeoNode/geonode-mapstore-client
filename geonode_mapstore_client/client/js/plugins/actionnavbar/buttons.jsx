/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import {
    toggleControl,
    setControlProperty
} from '@mapstore/framework/actions/controls';
import {
    toggleFullscreen
} from '@mapstore/framework/actions/fullscreen';

import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';

// buttons override to use in ActionNavbar for plugin imported from mapstore

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
            <Message msgId="printbutton" />
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
            <Message msgId="catalog.title" />
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
            <Message msgId="measureComponent.Measure" />
        </Button>
    );
});

export const FullScreenActionButton = connect(createSelector([
    state => state?.controls?.fullscreen?.enabled || false
], (enabled) => ({
    enabled
})), {
    onClick: (enabled) => toggleFullscreen(enabled, "#ms-container")
}
)(({
    onClick,
    variant,
    size,
    enabled
}) => {
    const FullScreenButton = tooltip(Button);
    return (
        <FullScreenButton
            tooltipPosition={enabled ? "left" : "top"}
            tooltip={ enabled ?  <Message msgId="gnviewer.nativescreen"/> : <Message msgId="gnviewer.fullscreen"/>  }
            variant={variant}
            size={size}
            onClick={() => onClick(!enabled)}
        >
            <FaIcon name={enabled ? "expand" : "expand"} />
        </FullScreenButton>
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
            <Message msgId="gnviewer.export" />
        </Button>
    );
});

export const AnnotationsActionButton = connect(
    () => ({}),
    { onClick: setControlProperty.bind(null, 'annotations', 'enabled', true, true) }
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
            <Message msgId="annotationsbutton" />
        </Button>
    );
});
