/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { projectionSelector } from '@mapstore/framework/selectors/map';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import isEqual from 'lodash/isEqual';
import FitBounds from '@mapstore/framework/components/geostory/common/map/FitBounds';

const MAX_EXTENT_WEB_MERCATOR = [-180, -85.06, 180, 85.06];

function FitBoundsPlugin({ mapProjection, ...props }) {
    const geometry = ['EPSG:900913', 'EPSG:3857'].includes(mapProjection) && isEqual(props.geometry, [-180, -90, 180, 90])
        ? MAX_EXTENT_WEB_MERCATOR
        : props.geometry;
    return (<FitBounds active { ...props } geometry={geometry}/>);
}

const ConnectedFitBoundsPlugin = connect(
    createSelector([
        state => state?.controls?.fitBounds?.geometry,
        projectionSelector
    ], (geometry, mapProjection) => ({
        geometry,
        mapProjection
    }))
)(FitBoundsPlugin);

export default createPlugin('FitBounds', {
    component: () => null,
    containers: {
        Map: {
            priority: 1,
            name: 'FitBounds',
            Tool: ConnectedFitBoundsPlugin
        }
    },
    epics: {},
    reducers: {}
});
