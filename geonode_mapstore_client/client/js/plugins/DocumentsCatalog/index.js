/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import { getDocuments } from '@js/api/geonode/v2';
import { addLayer, updateNode } from '@mapstore/framework/actions/layers';
import { zoomToExtent } from '@mapstore/framework/actions/map';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { layersSelector } from '@mapstore/framework/selectors/layers';
import documentscatalogEpics from '@js/plugins/DocumentsCatalog/epics';
import { mapLayoutValuesSelector } from '@mapstore/framework/selectors/maplayout';
import DocumentsCompactCatalog from '@js/plugins/DocumentsCatalog/components/DocumentsCompactCatalog';
import useIsMounted from "@js/hooks/useIsMounted";
import { documentsToLayerConfig } from '@js/plugins/DocumentsCatalog/utils';

function DocumentsCatalog({
    onAdd,
    onZoomTo,
    ...props
}) {
    const isMounted = useIsMounted();
    const [loading, setLoading] = useState(false);

    function handleSelectResource(entries) {
        setLoading(true);
        documentsToLayerConfig(entries)
            .then((layer) => {
                onAdd(layer);
                const { minx, miny, maxx, maxy } = layer?.bbox?.bounds || {};
                const extent = layer?.bbox?.bounds && [minx, miny, maxx, maxy];
                if (extent) {
                    onZoomTo(extent, layer?.bbox?.crs);
                }
            })
            .finally(() => {
                isMounted(() => setLoading(false));
            });
    }

    return (<DocumentsCompactCatalog
        {...props}
        loading={loading}
        onSelect={handleSelectResource}
        fields={props.fields}
    />);
}

DocumentsCatalog.propTypes = {
    request: PropTypes.func,
    responseToEntries: PropTypes.func,
    pageSize: PropTypes.number,
    onAdd: PropTypes.func,
    placeholderId: PropTypes.string,
    onClose: PropTypes.func,
    onZoomTo: PropTypes.func,
    fields: PropTypes.array
};

DocumentsCatalog.defaultProps = {
    request: getDocuments,
    responseToEntries: res => res.resources,
    pageSize: 10,
    onAdd: () => { },
    placeholderId: 'gnviewer.documentsCatalogFilterPlaceholder',
    titleId: 'gnviewer.documentsCatalogTitle',
    noResultId: 'gnviewer.documentsCatalogEntriesNoResults',
    onZoomTo: () => { },
    onClose: () => { },
    fields: [
        { type: "search" },
        { type: "select", facet: "category" },
        { type: "select", facet: "keyword" },
        { type: "select", facet: "extension" }
    ]
};

function DocumentsCatalogPlugin({ enabled, ...props }) {
    return enabled ? <DocumentsCatalog {...props} /> : null;
}

const ConnectedDocumentsCatalogPlugin = connect(
    createSelector([
        state => mapLayoutValuesSelector(state, { height: true }),
        state => state?.controls?.documentsCatalog?.enabled,
    ], (style, enabled) => ({
        style,
        enabled,
    })), {
        onAdd: addLayer,
        onClose: setControlProperty.bind(null, 'documentsCatalog', 'enabled', false),
        onZoomTo: zoomToExtent
    }
)(DocumentsCatalogPlugin);

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
    component: ConnectedDocumentsCatalogPlugin,
    containers: {
        ActionNavbar: {
            name: 'DocumentsCatalog',
            Component: ConnectedDocumentsCatalogButton
        }
    },
    epics: documentscatalogEpics,
    reducers: {}
});
