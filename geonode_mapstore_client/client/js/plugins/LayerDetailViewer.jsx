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
import {
    editTitleResource,
    editAbstractResource,
    editThumbnailResource,
    setFavoriteResource,
    setMapThumbnail,
    setResourceThumbnail,
    enableMapThumbnailViewer,
    downloadResource
} from '@js/actions/gnresource';
import { processingDownload } from '@js/selectors/resourceservice';
import FaIcon from '@js/components/FaIcon/FaIcon';
import controls from '@mapstore/framework/reducers/controls';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import gnresource from '@js/reducers/gnresource';
import {
    isThumbnailChanged,
    updatingThumbnailResource,
    getSelectedLayer
} from '@js/selectors/resource';
import GNButton from '@js/components/Button';
import useDetectClickOut from '@js/hooks/useDetectClickOut';
import OverlayContainer from '@js/components/OverlayContainer';
import { withRouter } from 'react-router';
import { hashLocationToHref } from '@js/utils/SearchUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import { mapSelector } from '@mapstore/framework/selectors/map';
import { resourceHasPermission } from '@js/utils/ResourceUtils';
import { parsePluginConfigExpressions } from '@js/utils/MenuUtils';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { getResourceTypesInfo } from '@js/utils/ResourceUtils';

const Button = tooltip(GNButton);

const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.layerDataset || null,
        state => state?.gnresource?.loading || false,
        state => state?.gnresource?.layerDataset?.favorite || false,
        state => state?.gnsave?.savingThumbnailMap || false,
        isThumbnailChanged,
        updatingThumbnailResource,
        mapSelector,
        state => state?.gnresource?.showMapThumbnail || false,
        processingDownload
    ], (resource, loading, favorite, savingThumbnailMap, thumbnailChanged, resourceThumbnailUpdating, mapData, showMapThumbnail, downloading) => ({
        resource,
        loading,
        savingThumbnailMap,
        favorite: favorite,
        isThumbnailChanged: thumbnailChanged,
        resourceThumbnailUpdating,
        initialBbox: mapData?.bbox,
        enableMapViewer: showMapThumbnail,
        downloading,
        canDownload: resourceHasPermission(resource, 'download_resourcebase'),
        resourceId: resource?.pk
    })),
    {
        closePanel: setControlProperty.bind(null, 'rightOverlay', 'enabled', false),
        onFavorite: setFavoriteResource,
        onMapThumbnail: setMapThumbnail,
        onResourceThumbnail: setResourceThumbnail,
        onClose: enableMapThumbnailViewer,
        onAction: downloadResource
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
        getSelectedLayer,
    ], (layer) => ({
        layer
    })),
    {
        onClick: setControlProperty.bind(
            null,
            'rightOverlay',
            'enabled',
            'DetailViewer'
        )
    }
)((ButtonViewer));

function LayerDetailViewer({
    location,
    enabled,
    onEditResource,
    onEditAbstractResource,
    onEditThumbnail,
    onClose,
    monitoredState,
    queryPathname = '/',
    tabs = []
}) {
    const parsedConfig = parsePluginConfigExpressions(monitoredState, { tabs });

    const handleTitleValue = (val) => {
        onEditResource(val);
    };

    const handleAbstractValue = (val) => {
        onEditAbstractResource(val);
    };
    const handleEditThumbnail = (val) => {
        onEditThumbnail(val, true);
    };

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
                editTitle={handleTitleValue}
                editAbstract={handleAbstractValue}
                editThumbnail={handleEditThumbnail}
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
            getSelectedLayer,
            state => getMonitoredState(state, getConfigProp('monitorState'))
        ],
        (enabled, layer, monitoredState) => ({
            enabled,
            layer,
            monitoredState
        })
    ),
    {
        onEditResource: editTitleResource,
        onEditAbstractResource: editAbstractResource,
        onEditThumbnail: editThumbnailResource,
        onClose: setControlProperty.bind(null, 'rightOverlay', 'enabled', false)
    }
)(withRouter(LayerDetailViewer));

export default createPlugin('LayerDetailViewer', {
    component: LayerDetailViewerPlugin,
    containers: {
        TOC: {
            target: 'toolbar',
            Component: ConnectedButton
        }
    },
    reducers: {
        gnresource,
        controls
    }
});
