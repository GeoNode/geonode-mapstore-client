/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useEffect, useState, Fragment} from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import LegendImage from '@mapstore/framework/components/TOC/fragments/legend/Legend';
import { layersSelector } from '@mapstore/framework/selectors/layers';

function Legend({
    layers,
    hideLayerTitle
}) {

    const [layerList, setLayerList] = useState([]);

    useEffect(() => {
        if (layers) {
            const usedLayers = layers.filter(layer => layer.group !== 'background' && layer.type === 'wms');
            setLayerList(usedLayers);
        }
    }, [layers]);

    return layerList.length > 0 && <div className="shadow gn-legend-wrapper">
        <ul className="gn-legend-list">
            <li className="gn-legend-list-item">Legend</li>
            {layerList.map((layer, ind) => <Fragment key={ind}>
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
    createSelector([layersSelector], (layers) => ({ layers })),
    {}
)(Legend);

export default createPlugin('Legend', {
    component: ConnectedLegend,
    containers: {},
    epics: {},
    reducers: {}
});
