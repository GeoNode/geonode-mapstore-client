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
import FitBounds from '@mapstore/framework/components/geostory/common/map/FitBounds';

function FitBoundsPlugin(props) {
    return (<FitBounds active { ...props }/>);
}

const ConnectedFitBoundsPlugin = connect(
    createSelector([
        state => state?.controls?.fitBounds?.geometry
    ], (geometry) => ({
        geometry
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
