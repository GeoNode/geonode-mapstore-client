/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import isEqual from 'lodash/isEqual';
import { resizeMap } from '@mapstore/framework/actions/map';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import usePluginItems from '@js/hooks/usePluginItems';
import {
    getResourceId,
    getSelectedLayerPermissions,
    isNewResource
} from '@js/selectors/resource';
import { withResizeDetector } from 'react-resize-detector';

// ensure the map trigger the force update/resize
// when the center container change size
function Center({
    configuredItems,
    width,
    onResize
}) {
    useEffect(() => {
        onResize();
    }, [width]);
    return (
        <>
            {configuredItems
                .filter(({ target }) => !target)
                .map(({ Component, name }) => <Component key={name} />)}
        </>
    );
}

const ConnectedCenter = connect(
    createSelector([], () => ({})),
    {
        onResize: resizeMap
    }
)(withResizeDetector(Center));
function ViewerLayout({
    items,
    resourcePk,
    selectedLayerPermissions,
    header
}, context) {
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins }, [resourcePk, selectedLayerPermissions]);
    const headerOrder = header?.order || [];
    const headerItems = configuredItems
        .filter(({ target }) => target === 'header')
        .sort((a, b) => headerOrder.indexOf(a.name) - headerOrder.indexOf(b.name))
        .map(({ Component, name }) => <Component key={name} />);
    return (
        <div
            className="gn-viewer-layout"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
            <header>
                {headerItems}
            </header>
            <div
                className="gn-viewer-layout-body"
                style={{
                    display: 'flex',
                    width: '100%',
                    flex: 1,
                    position: 'relative'
                }}>
                <div className="gn-viewer-left-column">
                    {configuredItems
                        .filter(({ target }) => target === 'leftColumn')
                        .map(({ Component, name }) => <Component key={name} />)}
                </div>
                <div
                    className="gn-viewer-layout-center"
                    style={{
                        flex: 1,
                        position: 'relative'
                    }}
                >
                    <ConnectedCenter configuredItems={configuredItems}/>
                </div>
                <div className="gn-viewer-right-column">
                    {configuredItems
                        .filter(({ target }) => target === 'rightColumn')
                        .map(({ Component, name }) => <Component key={name} />)}
                </div>
            </div>
            <div
                className="gn-viewer-right-overlay shadow-far"
                style={{
                    position: 'absolute',
                    right: 0,
                    height: '100%',
                    zIndex: 2000,
                    transform: 'all 0.3s'
                }}>
                {configuredItems
                    .filter(({ target }) => target === 'rightOverlay')
                    .map(({ Component, name }) => <Component key={name} />)}
            </div>
            <footer>
                {configuredItems
                    .filter(({ target }) => target === 'footer')
                    .map(({ Component, name }) => <Component key={name} />)}
            </footer>
        </div>
    );
}

ViewerLayout.contextTypes = {
    loadedPlugins: PropTypes.object
};

function arePropsEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

const MemoizeViewerLayout = memo(ViewerLayout, arePropsEqual);

const ViewerLayoutPlugin = connect(
    createSelector([
        getResourceId,
        getSelectedLayerPermissions,
        isNewResource
    ], (resourcePk, selectedLayerPermissions, isNew) => ({
        resourcePk: isNew ? 'new' : resourcePk,
        selectedLayerPermissions
    })),
    {}
)(MemoizeViewerLayout);

export default createPlugin('ViewerLayout', {
    component: ViewerLayoutPlugin,
    containers: {},
    epics: {},
    reducers: {}
});
