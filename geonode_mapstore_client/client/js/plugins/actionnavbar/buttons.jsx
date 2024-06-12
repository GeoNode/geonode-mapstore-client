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
    setControlProperty
} from '@mapstore/framework/actions/controls';
import {
    toggleFullscreen
} from '@mapstore/framework/actions/fullscreen';

import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { openQueryBuilder } from '@mapstore/framework/actions/layerFilter';
import { getSelectedLayer } from '@mapstore/framework/selectors/layers';
import { isDashboardEditing } from '@mapstore/framework/selectors/dashboard';
import { createWidget } from '@mapstore/framework/actions/widgets';
import { getResourceData } from '@js/selectors/resource';
import { GXP_PTYPES } from '@js/utils/ResourceUtils';

// buttons override to use in ActionNavbar for plugin imported from mapstore

export const FullScreenActionButton = connect(createSelector([
    state => state?.controls?.fullscreen?.enabled || false
], (enabled) => ({
    enabled
})), {
    onClick: (enabled) => toggleFullscreen(enabled)
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
    (state) => ({
        data: getResourceData(state)
    }),
    { onClick: setControlProperty.bind(null, 'layerdownload', 'enabled', true, true) }
)(({
    onClick,
    variant,
    size,
    data
}) => {
    // hide button for arcgis sources
    if ([GXP_PTYPES.REST_MAP, GXP_PTYPES.REST_IMG].includes(data?.ptype)) {
        return null;
    }
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="gnhome.dataset" />
        </Button>
    );
});

export const FilterLayerActionButton = connect(
    (state) => ({
        active: !!getSelectedLayer(state)?.layerFilter
    }),
    { onClick: openQueryBuilder }
)(({
    onClick,
    variant,
    size,
    active
}) => {
    return (
        <Button
            variant={variant}
            className={active ? 'gn-success-changes-icon' : ''}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="gnhome.filter" />
        </Button>
    );
});

export const AddWidgetActionButton = connect(
    (state) => ({
        enabled: !!isDashboardEditing(state)
    }),
    { onClick: createWidget }
)(({
    onClick,
    variant,
    size,
    enabled
}) => {
    return (
        <Button
            variant={variant}
            size={size}
            disabled={enabled}
            onClick={() => onClick()}
        >
            <Message msgId="gnviewer.addWidget" />
        </Button>
    );
});
