/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import { addLayer } from '@mapstore/framework/actions/layers';
import { zoomToExtent } from '@mapstore/framework/actions/map';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import documentscatalogEpics from '@js/plugins/DocumentsCatalog/epics';
import { mapLayoutValuesSelector } from '@mapstore/framework/selectors/maplayout';
import ConnectedDocumentsCatalog from '@js/plugins/DocumentsCatalog/containers/DocumentsCatalog';
import DocumentInfoViewer from '@js/plugins/DocumentsCatalog/containers/DocumentInfoViewer';
import { registerRowViewer } from '@mapstore/framework/utils/MapInfoUtils';
import { GEONODE_DOCUMENTS_ROW_VIEWER } from '@js/plugins/DocumentsCatalog/constants';

function DocumentsCatalog({
    enabled,
    items = [],
    order = {
        defaultLabelId: 'resourcesCatalog.orderBy',
        options: [
            {
                label: 'Most recent',
                labelId: 'resourcesCatalog.mostRecent',
                value: '-created'
            },
            {
                label: 'Less recent',
                labelId: 'resourcesCatalog.lessRecent',
                value: 'created'
            },
            {
                label: 'A Z',
                labelId: 'resourcesCatalog.aZ',
                value: 'title'
            },
            {
                label: 'Z A',
                labelId: 'resourcesCatalog.zA',
                value: '-title'
            }
        ]
    },
    metadata = {
        grid: [
            { path: 'title', labelId: 'catalog.title', width: 40 },
            { path: 'date', labelId: 'catalog.date', width: 30 },
            { path: 'owner', labelId: 'catalog.owner', width: 30 }
        ]
    },
    resourceTypes = ['MAP', 'DASHBOARD', 'GEOSTORY', 'CONTEXT'],
    ...props }) {

    useEffect(() => {
        registerRowViewer(GEONODE_DOCUMENTS_ROW_VIEWER, DocumentInfoViewer);
        return () => {
            registerRowViewer(GEONODE_DOCUMENTS_ROW_VIEWER, undefined);
        };
    }, []);

    return enabled ? <ConnectedDocumentsCatalog items={items} order={order} metadata={metadata} resourceTypes={resourceTypes} {...props} /> : null;
}

const DocumentsCatalogPlugin = connect(
    createSelector([
        state => mapLayoutValuesSelector(state, { height: true }),
        state => state?.controls?.documentsCatalog?.enabled
    ], (style, enabled) => ({
        style,
        enabled
    })), {
        onAdd: addLayer,
        onClose: setControlProperty.bind(null, 'documentsCatalog', 'enabled', false),
        onZoomTo: zoomToExtent
    }
)(DocumentsCatalog);


const DocumentsCatalogButton = ({
    onClick,
    size,
    variant
}) => {
    const handleClickButton = () => {
        onClick();
    };

    return (
        <Button
            size={size}
            onClick={handleClickButton}
            variant={variant}
        >
            <Message msgId="gnviewer.addDocument" />
        </Button>
    );
};

const ConnectedDocumentsCatalogButton = connect(
    createSelector([], () => ({})),
    {
        onClick: setControlProperty.bind(null, 'documentsCatalog', 'enabled', true)
    }
)((DocumentsCatalogButton));


export default createPlugin('DocumentsCatalog', {
    component: DocumentsCatalogPlugin,
    containers: {
        ActionNavbar: {
            name: 'DocumentsCatalog',
            Component: ConnectedDocumentsCatalogButton
        }
    },
    epics: documentscatalogEpics,
    reducers: {}
});
