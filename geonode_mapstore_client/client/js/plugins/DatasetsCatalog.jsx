/*
 * Copyright 2021, GeoSolutions Sas.
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
import { getDatasets, getDatasetByPk, getResourceByPk } from '@js/api/geonode/v2';
import { resourceToLayerConfig, isDefaultDatasetSubtype } from '@js/utils/ResourceUtils';
import { addLayer } from '@mapstore/framework/actions/layers';
import { zoomToExtent } from '@mapstore/framework/actions/map';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import datasetscatalogEpics from '@js/epics/datasetscatalog';
import { mapLayoutValuesSelector } from '@mapstore/framework/selectors/maplayout';
import ResourcesCompactCatalog from '@js/components/ResourcesCompactCatalog';
import useIsMounted from "@js/hooks/useIsMounted";

function DatasetsCatalog({
    onAdd,
    onZoomTo,
    ...props
}) {
    const isMounted = useIsMounted();
    const [loading, setLoading] = useState(false);

    function handleSelectResource(entry) {
        setLoading(true);
        (isDefaultDatasetSubtype(entry.subtype)
            ? getDatasetByPk(entry.pk)
            : getResourceByPk(entry.pk))
            .then((dataset) => {
                const layer = resourceToLayerConfig(dataset);
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

    return (<ResourcesCompactCatalog
        {...props}
        loading={loading}
        onSelect={handleSelectResource}
    />);
}

DatasetsCatalog.propTypes = {
    request: PropTypes.func,
    responseToEntries: PropTypes.func,
    pageSize: PropTypes.number,
    onAdd: PropTypes.func,
    placeholderId: PropTypes.string,
    onClose: PropTypes.func,
    onZoomTo: PropTypes.func
};

DatasetsCatalog.defaultProps = {
    request: getDatasets,
    responseToEntries: res => res.resources,
    pageSize: 10,
    onAdd: () => { },
    placeholderId: 'gnviewer.datasetsCatalogFilterPlaceholder',
    titleId: 'gnviewer.datasetsCatalogTitle',
    noResultId: 'gnviewer.datasetsCatalogEntriesNoResults',
    onZoomTo: () => { },
    onClose: () => { }
};

function DatasetsCatalogPlugin({ enabled, ...props }) {
    return enabled ? <DatasetsCatalog {...props} /> : null;
}

const ConnectedDatasetsCatalogPlugin = connect(
    createSelector([
        state => mapLayoutValuesSelector(state, { height: true }),
        state => state?.controls?.datasetsCatalog?.enabled
    ], (style, enabled) => ({
        style,
        enabled
    })), {
        onAdd: addLayer,
        onClose: setControlProperty.bind(null, 'datasetsCatalog', 'enabled', false),
        onZoomTo: zoomToExtent
    }
)(DatasetsCatalogPlugin);

const DatasetsCatalogButton = ({
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
            <Message msgId="gnviewer.addLayer" />
        </Button>
    );
};

const ConnectedDatasetsCatalogButton = connect(
    createSelector([], () => ({})),
    {
        onClick: setControlProperty.bind(null, 'datasetsCatalog', 'enabled', true)
    }
)((DatasetsCatalogButton));

export default createPlugin('DatasetsCatalog', {
    component: ConnectedDatasetsCatalogPlugin,
    containers: {
        ActionNavbar: {
            name: 'DatasetsCatalog',
            Component: ConnectedDatasetsCatalogButton
        }
    },
    epics: datasetscatalogEpics,
    reducers: {}
});
