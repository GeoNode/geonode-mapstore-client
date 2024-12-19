/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin, getMonitoredState } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import DetailsPanel from '@js/components/DetailsPanel';
import { enableMapThumbnailViewer } from '@js/actions/gnresource';
import FaIcon from '@js/components/FaIcon/FaIcon';
import controls from '@mapstore/framework/reducers/controls';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import gnresource from '@js/reducers/gnresource';
import { getSelectedLayerDataset } from '@js/selectors/resource';
import GNButton from '@js/components/Button';
import useDetectClickOut from '@js/hooks/useDetectClickOut';
import OverlayContainer from '@js/components/OverlayContainer';
import { withRouter } from 'react-router';
import { hashLocationToHref } from '@js/utils/SearchUtils';
import { mapSelector } from '@mapstore/framework/selectors/map';
import { parsePluginConfigExpressions } from '@js/utils/MenuUtils';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import tabComponents from '@js/plugins/detailviewer/tabComponents';

const Button = tooltip(GNButton);

const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.selectedLayerDataset || null,
        state => state?.gnresource?.loading || false,
        mapSelector,
        state => state?.gnresource?.showMapThumbnail || false
    ], (resource, loading, mapData, showMapThumbnail) => ({
        resource,
        loading,
        initialBbox: mapData?.bbox,
        enableMapViewer: showMapThumbnail,
        resourceId: resource?.pk,
        tabComponents
    })),
    {
        closePanel: setControlProperty.bind(null, 'rightOverlay', 'enabled', false),
        onClose: enableMapThumbnailViewer
    }
)(DetailsPanel);

const ButtonViewer = ({ onClick, layer, size, status }) => {
    const layerResourceId = layer?.pk;
    const handleClickButton = () => {
        onClick();
    };
    return layerResourceId && status === 'LAYER' ? (
        <Button
            variant="primary"
            size={size}
            onClick={handleClickButton}
        >
            <FaIcon name={'info-circle'} />
        </Button>
    ) : null;
};

const ConnectedButton = connect(
    createSelector([
        getSelectedLayerDataset
    ], (layer) => ({
        layer
    })),
    {
        onClick: setControlProperty.bind(
            null,
            'rightOverlay',
            'enabled',
            'LayerDetailViewer'
        )
    }
)((ButtonViewer));

function LayerDetailViewer({
    location,
    enabled,
    onClose,
    monitoredState,
    queryPathname = '/',
    tabs = []
}) {
    const parsedConfig = parsePluginConfigExpressions(monitoredState, { tabs });

    const node = useDetectClickOut({
        disabled: !enabled,
        onClickOut: () => {
            onClose();
        }
    });

    const handleFormatHref = (options) => {
        return hashLocationToHref({
            location,
            ...options
        });
    };

    return (
        <OverlayContainer
            enabled={enabled}
            ref={node}
            className="gn-overlay-wrapper"
        >
            <ConnectedDetailsPanel
                editTitle={null}
                editAbstract={null}
                editThumbnail={() => {}}
                activeEditMode={false}
                enableFavorite={false}
                formatHref={handleFormatHref}
                tabs={parsedConfig.tabs}
                pathname={queryPathname}
            />
        </OverlayContainer>
    );
}

const LayerDetailViewerPlugin = connect(
    createSelector(
        [
            (state) =>
                state?.controls?.rightOverlay?.enabled === 'LayerDetailViewer',
            getSelectedLayerDataset,
            state => getMonitoredState(state, getConfigProp('monitorState'))
        ],
        (enabled, layer, monitoredState) => ({
            enabled,
            layer,
            monitoredState
        })
    ),
    {
        onClose: setControlProperty.bind(null, 'rightOverlay', 'enabled', false)
    }
)(withRouter(LayerDetailViewer));

export default createPlugin('LayerDetailViewer', {
    component: LayerDetailViewerPlugin,
    containers: {
        TOC: {
            target: 'toolbar',
            name: 'LayerDetailViewerButton',
            Component: ConnectedButton
        }
    },
    reducers: {
        gnresource,
        controls
    }
});
