/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useRef } from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import usePluginItems from '@mapstore/framework/hooks/usePluginItems';
import {
    setControlProperty
} from '@mapstore/framework/actions/controls';
import {
    toggleFullscreen
} from '@mapstore/framework/actions/fullscreen';
import { Dropdown, MenuItem, Glyphicon } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { openQueryBuilder } from '@mapstore/framework/actions/layerFilter';
import { getSelectedLayer } from '@mapstore/framework/selectors/layers';
import { isDashboardEditing } from '@mapstore/framework/selectors/dashboard';
import { createWidget } from '@mapstore/framework/actions/widgets';
import { getResourceData, getSelectedLayerDataset } from '@js/selectors/resource';
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
    enabled,
    showText
}) => {
    const FullScreenButton = tooltip(Button);
    const label = enabled ?  <Message msgId="gnviewer.nativescreen"/> : <Message msgId="gnviewer.fullscreen"/>;
    return (
        <FullScreenButton
            tooltipPosition={enabled ? "left" : "top"}
            tooltip={ showText ? undefined : label }
            variant={variant}
            size={size}
            onClick={() => onClick(!enabled)}
        >
            {showText ? label : <FaIcon name={enabled ? "expand" : "expand"} />}
        </FullScreenButton>
    );
});

const LayerDownloadActionButtonComponent = ({
    onClick,
    variant,
    size,
    data,
    nodeTypes,
    items,
    status,
    statusTypes
}, context) => {
    const node = useRef();
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });
    // nodeTypes is included in the TOC plugin as additional prop
    const isTOCItem = !!nodeTypes;
    // hide button for arcgis sources
    if ([GXP_PTYPES.REST_MAP, GXP_PTYPES.REST_IMG].includes(data?.ptype)) {
        return null;
    }
    if (isTOCItem) {
        return status === statusTypes.LAYER ? (
            <>
                <Dropdown
                    style={{ position: 'absolute' }}
                >
                    <Dropdown.Toggle
                        noCaret
                        bsStyle="primary"
                        className="square-button-md"
                    >
                        <Glyphicon glyph="download" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ width: 'auto', minWidth: 'max-content' }}>
                        {configuredItems.map(({ Component, name }) => {
                            return (<Component key={name} renderType="menuItem" resource={data} />);
                        })}
                        <MenuItem onClick={() => onClick()}>
                            <Message msgId="gnviewer.exportData" />
                        </MenuItem>
                    </Dropdown.Menu>
                </Dropdown>
                {/* include a placeholder to compute the space */}
                <div ref={node} className="square-button-md" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
            </>
        ) : null;
    }
    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="gnviewer.exportData" />
        </Button>
    );
};

LayerDownloadActionButtonComponent.contextTypes = {
    loadedPlugins: PropTypes.object
};

export const LayerDownloadActionButton = connect(
    createSelector([getResourceData, getSelectedLayerDataset],
        (resourceData, selectedLayerDataset) => ({
            data: selectedLayerDataset ? selectedLayerDataset : resourceData
        })
    ),
    { onClick: setControlProperty.bind(null, 'layerdownload', 'enabled', true, true) }
)(LayerDownloadActionButtonComponent);

export const FilterLayerActionButton = connect(
    (state) => ({
        layer: getSelectedLayer(state)
    }),
    { onClick: openQueryBuilder }
)(({
    onClick,
    variant,
    size,
    layer
}) => {
    const active = !!layer?.layerFilter;
    if (!layer?.search) {
        return null;
    }
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
