/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useMemo } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { projectionSelector } from '@mapstore/framework/selectors/map';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import FitBounds from '@mapstore/framework/components/geostory/common/map/FitBounds';

const MAX_EXTENT_WEB_MERCATOR = [-180, -85, 180, 85];

function FitBoundsPlugin({ mapProjection, ...props }) {
    function validateGeometry(geometry, projection) {
        if (geometry && ['EPSG:900913', 'EPSG:3857'].includes(projection)) {
            const [minx, miny, maxx, maxy] = geometry;
            const [eMinx, eMiny, eMaxx, eMaxy] = MAX_EXTENT_WEB_MERCATOR;
            return [
                minx < eMinx ? eMinx : minx,
                miny < eMiny ? eMiny : miny,
                maxx > eMaxx ? eMaxx : maxx,
                maxy > eMaxy ? eMaxy : maxy
            ];
        }
        return geometry;
    }
    const geometry = useMemo(() => validateGeometry(props.geometry, mapProjection), [props.geometry, mapProjection]);
    return <FitBounds active { ...props } geometry={geometry}/>;
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
