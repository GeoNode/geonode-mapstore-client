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

function Legend({
    layers,
    hideLayerTitle
}) {

    const [expandLegend, setExpandLegend] = useState(false);

    const expand = () => {
        setExpandLegend(ex => !ex);
    };

    return layers.length > 0 && <div className="shadow gn-legend-wrapper" style={{width: expandLegend ? 'auto' : '80px'}}>
        <div onClick={expand} className="gn-legend-head">
            <span role="button" className={`identify-icon glyphicon glyphicon-chevron-${expandLegend ? 'down' : 'right'}`} title="Expand layer legend" />
            <span className="gn-legend-list-item">Legend</span>
        </div>
        <ul className="gn-legend-list" style={{display: expandLegend ? 'inline-block' : 'none'}}>
            {layers.map((layer, ind) => <Fragment key={ind}>
                {!hideLayerTitle &&
                    <li className="gn-legend-list-item"><p>{layer.title}</p></li>
                }
                <li>
                    <LegendImage layer={layer} />
                </li>
            </Fragment>
            )}
        </ul>
    </div>;
}

const ConnectedLegend = connect(
    createSelector([layersSelector], (layers) => ({layers: layers.filter(layer => layer.group !== 'background' && layer.type === 'wms')})),
    {}
)(Legend);

export default createPlugin('Legend', {
    component: ConnectedLegend,
    containers: {},
    epics: {},
    reducers: {}
});
