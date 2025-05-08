/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import DetailsPanel from './ResourceDetails/containers/DetailsPanel';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import controls from '@mapstore/framework/reducers/controls';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import gnresource from '@js/reducers/gnresource';
import { getSelectedLayerDataset } from '@js/selectors/resource';
import GNButton from '@mapstore/framework/components/layout/Button';
import useDetectClickOut from '@js/hooks/useDetectClickOut';
import OverlayContainer from '@js/components/OverlayContainer';
import { withRouter } from 'react-router';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import tabComponents from '@js/plugins/ResourceDetails/containers/tabComponents';

const Button = tooltip(GNButton);

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
            <Icon glyph={'info-circle'} />
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
    enabled,
    onClose,
    tabs = [],
    resource
}) {

    const node = useDetectClickOut({
        disabled: !enabled,
        onClickOut: () => {
            onClose();
        }
    });

    return (
        <OverlayContainer
            enabled={enabled}
            ref={node}
            className="gn-overlay-wrapper"
        >
            <DetailsPanel
                resource={resource}
                onClose={onClose}
                tabs={tabs}
                tabComponents={tabComponents}
            />
        </OverlayContainer>
    );
}

const LayerDetailViewerPlugin = connect(
    createSelector(
        [
            (state) => state?.controls?.rightOverlay?.enabled === 'LayerDetailViewer',
            getSelectedLayerDataset
        ],
        (enabled, resource) => ({
            enabled,
            resource
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
            Component: ConnectedButton,
            position: 12
        }
    },
    reducers: {
        gnresource,
        controls
    }
});
