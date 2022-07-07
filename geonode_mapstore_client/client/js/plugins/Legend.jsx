/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, Fragment } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import LegendImage from '@mapstore/framework/components/TOC/fragments/legend/Legend';
import { layersSelector } from '@mapstore/framework/selectors/layers';
import OpacitySlider from '@mapstore/framework/components/TOC/fragments/OpacitySlider';
import { updateNode } from '@mapstore/framework/actions/layers';
import VisibilityCheck from '@mapstore/framework/components/TOC/fragments/VisibilityCheck';
import Message from '@mapstore/framework/components/I18N/HTML';

function Legend({
    layers,
    onUpdateNode
}) {

    const [expandLegend, setExpandLegend] = useState(false);

    const expand = () => {
        setExpandLegend(ex => !ex);
    };

    return layers.length > 0 && <div className="shadow gn-legend-wrapper" style={{width: expandLegend ? 'auto' : '80px'}}>
        <div onClick={expand} className="gn-legend-head">
            <span role="button" className={`identify-icon glyphicon glyphicon-chevron-${expandLegend ? 'down' : 'right'}`} title="Expand layer legend" />
            <span className="gn-legend-list-item"><Message msgId="gnviewer.legend" /></span>
        </div>
        <ul className="gn-legend-list" style={{display: expandLegend ? 'inline-block' : 'none'}}>
            {layers.map((layer, ind) => <Fragment key={ind}>
                <li className="gn-legend-list-item"><VisibilityCheck key="visibilitycheck"
                    tooltip={layer.loadingError === 'Warning' ? 'toc.toggleLayerVisibilityWarning' : 'toc.toggleLayerVisibility'}
                    node={layer}
                    propertiesChangeHandler={(id, options) => onUpdateNode(id, 'layers', options)} /><p>{layer.title}</p></li>
                <li className="gn-legend-bottom">
                    <OpacitySlider
                        opacity={layer.opacity}
                        disabled={!layer.visibility}
                        onChange={(opacity) => onUpdateNode(layer.id, 'layers', { opacity })}
                    />
                    <LegendImage layer={layer} />
                </li>
            </Fragment>
            )}
        </ul>
    </div>;
}

const ConnectedLegend = connect(
    createSelector([
        layersSelector
    ], (layers) => ({ layers: layers.filter(layer => layer.group !== 'background' && layer.type === 'wms') })),
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
