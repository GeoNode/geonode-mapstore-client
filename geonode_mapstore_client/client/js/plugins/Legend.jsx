/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { layersSelector } from '@mapstore/framework/selectors/layers';
import { mapSelector } from '@mapstore/framework/selectors/map';
import { updateNode } from '@mapstore/framework/actions/layers';
import Message from '@mapstore/framework/components/I18N/HTML';
import TOC from '@mapstore/framework/plugins/TOC/components/TOC';
import { currentLocaleLanguageSelector, currentLocaleSelector } from '@mapstore/framework/selectors/locale';
import { isLocalizedLayerStylesEnabledSelector } from '@mapstore/framework/selectors/localizedLayerStyles';
import { getScales } from '@mapstore/framework/utils/MapUtils';

function applyVersionParamToLegend(layer) {
    // we need to pass a parameter that invalidate the cache for GetLegendGraphic
    // all layer inside the dataset viewer apply a new _v_ param each time we switch page
    return { ...layer, legendParams: { ...layer?.legendParams, _v_: layer?._v_ } };
}

function Legend({
    layers,
    onUpdateNode,
    currentZoomLvl,
    scales,
    language,
    currentLocale
}) {

    const [expandLegend, setExpandLegend] = useState(false);

    const expand = () => {
        setExpandLegend(ex => !ex);
    };

    if (!layers.length) {
        return null;
    }

    return (
        <div className="shadow gn-legend-wrapper" style={{ position: 'absolute', margin: 4, width: 'auto', zIndex: 50 }}>
            <div onClick={expand} className="gn-legend-head" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                <span role="button" className={`identify-icon glyphicon glyphicon-${expandLegend ? 'bottom' : 'next'}`} title="Expand layer legend" />
                <span className="gn-legend-list-item" style={{ paddingLeft: 4 }}><Message msgId="gnviewer.legend" /></span>
            </div>
            <div style={{ display: expandLegend ? 'block' : 'none' }}>
                <TOC
                    map={{
                        layers: layers.map(applyVersionParamToLegend),
                        groups: []
                    }}
                    theme="legend"
                    config={{
                        sortable: false,
                        showFullTitle: true,
                        hideOpacitySlider: false,
                        hideVisibilityButton: false,
                        expanded: true,
                        language,
                        currentLocale,
                        scales,
                        zoom: currentZoomLvl
                    }}
                    onChangeMap={(newMap) => {
                        newMap.layers.forEach(layer => {
                            onUpdateNode(layer.id, 'layers', {
                                opacity: layer.opacity,
                                visibility: layer.visibility
                            });
                        });
                    }}
                />
            </div>
        </div>
    );
}

const ConnectedLegend = connect(
    createSelector([
        layersSelector,
        mapSelector,
        currentLocaleSelector,
        currentLocaleLanguageSelector,
        isLocalizedLayerStylesEnabledSelector
    ], (layers, map, currentLocale, currentLocaleLanguage, isLocalizedLayerStylesEnabled) => ({
        layers: layers.filter(layer => layer.group !== 'background' && layer.type === 'wms'),
        currentZoomLvl: map?.zoom,
        scales: getScales(
            map && map.projection || 'EPSG:3857',
            map && map.mapOptions && map.mapOptions.view && map.mapOptions.view.DPI || null
        ),
        language: isLocalizedLayerStylesEnabled ? currentLocaleLanguage : null,
        currentLocale
    })),
    {
        onUpdateNode: updateNode

    }
)(Legend);

export default createPlugin('Legend', {
    component: ConnectedLegend,
    containers: {},
    epics: {},
    reducers: {}
});
