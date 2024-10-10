/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import isArray from 'lodash/isArray';
import uniqBy from 'lodash/uniqBy';
import Viewer from './Viewer';
import {
    contextMonitoredStateSelector,
    currentPluginsSelector,
    contextThemeSelector,
    contextCustomVariablesEnabledSelector
} from '@mapstore/framework/selectors/context';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { getGeoNodeConfig } from '@js/utils/APIUtils';
import { ResourceTypes } from '@js/utils/ResourceUtils';

const DEFAULT_PLUGINS_CONFIG = [];

function getPluginsConfiguration(name, pluginsConfig) {
    if (!pluginsConfig) {
        return DEFAULT_PLUGINS_CONFIG;
    }
    if (isArray(pluginsConfig)) {
        return pluginsConfig;
    }
    const { isMobile } = getConfigProp('geoNodeSettings') || {};
    if (isMobile && pluginsConfig) {
        return pluginsConfig[`${name}_mobile`] || pluginsConfig[name] || DEFAULT_PLUGINS_CONFIG;
    }
    return pluginsConfig[name] || DEFAULT_PLUGINS_CONFIG;
}

function MapViewerRoute({
    name,
    pluginsConfig: propPluginsConfig,
    viewerPluginsConfig,
    theme,
    customVariablesEnabled,
    embed,
    resource,
    hasViewer,
    ...props
}) {

    const { pk } = props?.match?.params || {};

    const selectPluginsConfig = () => {
        if (hasViewer === true && embed) {
            return [
                ...getPluginsConfiguration(name, propPluginsConfig)
                    .filter((plugin) => !!plugin.mandatory),
                ...getPluginsConfiguration('desktop', viewerPluginsConfig)
            ];
        }
        if (hasViewer === true && (resource?.pk === pk || pk === 'new')) {
            return uniqBy([
                ...getPluginsConfiguration(name, propPluginsConfig)
                    .filter((plugin) => !!plugin.mandatory),
                ...((viewerPluginsConfig)
                    ? getPluginsConfiguration('desktop', viewerPluginsConfig)
                    : [])
            ], 'name');
        }
        if (hasViewer === false) {
            return getPluginsConfiguration(name, propPluginsConfig);
        }
        return DEFAULT_PLUGINS_CONFIG;
    };

    const pluginsConfig = selectPluginsConfig();

    return (<>
        <Viewer
            name={name}
            pluginsConfig={pluginsConfig}
            loaderStyle={{
                opacity: 0.5
            }}
            {...props}
        />
    </>);
}

const ConnectedMapViewerRoute = connect(
    createSelector([
        currentPluginsSelector,
        contextMonitoredStateSelector,
        contextThemeSelector,
        contextCustomVariablesEnabledSelector,
        state => state?.gnresource?.data,
        state => state?.gnresource?.params?.hasViewer,
        state => state?.gnresource?.loadingResourceConfig,
        state => state?.gnresource?.configError
    ], (viewerPluginsConfig, viewerMonitoredState, theme, customVariablesEnabled, resource, hasViewer, loadingConfig, configError) => ({
        viewerPluginsConfig,
        viewerMonitoredState,
        theme,
        customVariablesEnabled,
        resource,
        hasViewer,
        loadingConfig,
        configError
    })),
    {}
)(MapViewerRoute);

ConnectedMapViewerRoute.displayName = 'ConnectedMapViewerRoute';

const SwitchViewer = (props) => {
    // the page inject the resource type only for embed layers
    const pageResourceType = getGeoNodeConfig('resourceType');
    const { pk } = props?.match?.params || {};
    const ViewerComponent = pk === 'new' || (!!pageResourceType && pageResourceType !== ResourceTypes.MAP)
        ? Viewer
        : ConnectedMapViewerRoute;
    return <ViewerComponent embed={!!pageResourceType} {...props}/>;
};

export default SwitchViewer;
