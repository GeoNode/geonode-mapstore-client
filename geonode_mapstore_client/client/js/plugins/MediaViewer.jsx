/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import MediaViewerComponent from '@js/components/MediaViewer';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import gnresource from '@js/reducers/gnresource';

const ConnectedMediaViewer = connect(
    createSelector([
        state => state?.gnresource?.data || null,
        state => state?.gnresource?.loading || false
    ], (resource, loading, editMode) => ({
        resource,
        loading,
        editMode
    }))
)(MediaViewerComponent);

/*
 * Plugin for Media Viewer
 * @name MediaViewer
 * @prop {string} gltf.environmentFiles path to an hdr environment file for the 3d scene (format gltf)
 * @prop {string} pcd.environmentFiles path to an hdr environment file for the 3d scene (format pcd)
 */
function MediaViewer(props) {
    return (
        <div
            className="gn-media-viewer">
            <ConnectedMediaViewer {...props}/>
        </div>
    );
}

const MediaViewerPlugin = connect(
    createSelector([], () => ({})),
    {}
)(MediaViewer);


export default createPlugin('MediaViewer', {
    component: MediaViewerPlugin,
    containers: {},
    epics: {},
    reducers: {
        gnresource
    }
});
