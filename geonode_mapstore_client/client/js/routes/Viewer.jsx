/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import url from 'url';
import isArray from 'lodash/isArray';
import { getMonitoredState } from '@mapstore/framework/utils/PluginsUtils';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import PluginsContainer from '@mapstore/framework/components/plugins/PluginsContainer';
import useLazyPlugins from '@js/hooks/useLazyPlugins';
import { requestResourceConfig, requestNewResourceConfig } from '@js/actions/gnresource';
import MetaTags from '@js/components/MetaTags';
import MainErrorView from '@js/components/MainErrorView';
import ViewerLayout from '@js/components/ViewerLayout';
import { createShallowSelector } from '@mapstore/framework/utils/ReselectUtils';

const urlQuery = url.parse(window.location.href, true).query;

const ConnectedPluginsContainer = connect(
    createShallowSelector(
        state => urlQuery.mode || (urlQuery.mobile || state.browser && state.browser.mobile ? 'mobile' : 'desktop'),
        state => getMonitoredState(state, getConfigProp('monitorState')),
        state => state?.controls,
        (mode, monitoredState, controls) => ({
            mode,
            monitoredState,
            pluginsState: controls
        })
    )
)(PluginsContainer);

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
    return pluginsConfig[name] || DEFAULT_PLUGINS_CONFIG
}

function ViewerRoute({
    name,
    pluginsConfig: propPluginsConfig,
    params,
    onUpdate,
    onCreate = () => {},
    loaderComponent,
    lazyPlugins,
    plugins,
    match,
    resource,
    siteName,
    resourceType,
    loadingConfig,
    configError
}) {

    const { pk } = match.params || {};
    const pluginsConfig = getPluginsConfiguration(name, propPluginsConfig);

    const { plugins: loadedPlugins, pending } = useLazyPlugins({
        pluginsEntries: lazyPlugins,
        pluginsConfig
    });
    useEffect(() => {
        if (!pending && pk !== undefined) {
            if (pk === 'new') {
                onCreate(resourceType);
            } else {
                onUpdate(resourceType, pk, {
                    page: name
                });
            }
        }
    }, [pending, pk]);

    const loading = loadingConfig || pending;
    const parsedPlugins = useMemo(() => ({ ...loadedPlugins, ...plugins }), [loadedPlugins]);
    const Loader = loaderComponent;
    const className = `page-${resourceType}-viewer`;

    useEffect(() => {
        // hide the naviagtion bar is a recource is being viewed
        if (!loading) {
            document.getElementById('gn-topbar')?.classList.add('hide-navigation');
            document.querySelector('.gn-menu-content-bottom')?.classList.add('hide-search-bar');
        }
        return () => {
            document.getElementById('gn-topbar')?.classList.remove('hide-navigation');
            document.querySelector('.gn-menu-content-bottom')?.classList.remove('hide-search-bar');
        };
    }, [loading]);

    return (
        <>
            {resource && <MetaTags
                logo={resource.thumbnail_url}
                title={(resource?.title) ? `${resource?.title} - ${siteName}` : siteName }
                siteName={siteName}
                contentURL={resource?.detail_url}
                content={resource?.abstract}
            />}
            {!loading && <ConnectedPluginsContainer
                key={className}
                id={className}
                className={className}
                component={ViewerLayout}
                pluginsConfig={pluginsConfig}
                plugins={parsedPlugins}
                params={params}
            />}
            {loading && Loader && <Loader />}
            {configError && <MainErrorView msgId={configError}/>}
        </>
    );
}

ViewerRoute.propTypes = {
    onUpdate: PropTypes.func
};

const ConnectedViewerRoute = connect(
    createSelector([
        state => state?.gnresource?.data,
        state => state?.gnsettings?.siteName || 'GeoNode',
        state => state?.gnresource?.loadingResourceConfig,
        state => state?.gnresource?.configError
    ], (resource, siteName, loadingConfig, configError) => ({
        resource,
        siteName,
        loadingConfig,
        configError
    })),
    {
        onUpdate: requestResourceConfig,
        onCreate: requestNewResourceConfig

    }
)(ViewerRoute);

ConnectedViewerRoute.displayName = 'ConnectedViewerRoute';

export default ConnectedViewerRoute;
