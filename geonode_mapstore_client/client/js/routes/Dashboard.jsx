/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import isArray from 'lodash/isArray';
import url from 'url';
import BorderLayout from '@mapstore/framework/components/layout/BorderLayout';
import { getMonitoredState } from '@mapstore/framework/utils/PluginsUtils';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { updateUrlOnScroll } from '@mapstore/framework/actions/geostory';
import PluginsContainer from '@mapstore/framework/components/plugins/PluginsContainer';

import useLazyPlugins from '@js/hooks/useLazyPlugins';

const urlQuery = url.parse(window.location.href, true).query;

const ConnectedPluginsContainer = connect((state) => ({
    mode: urlQuery.mode || (urlQuery.mobile || state.browser && state.browser.mobile ? 'mobile' : 'desktop'),
    monitoredState: getMonitoredState(state, getConfigProp('monitorState'))
}))(PluginsContainer);

function DashboardRoute({
    name,
    pluginsConfig: propPluginsConfig,
    params,
    onMount,
    loaderComponent,
    lazyPlugins,
    plugins
}) {

    const pluginsConfig = isArray(propPluginsConfig)
        ? propPluginsConfig
        : propPluginsConfig && propPluginsConfig[name] || [];
    console.log(pluginsConfig);
    const [loading, setLoading] = useState(true);
    const { plugins: loadedPlugins } = useLazyPlugins({
        pluginsEntries: lazyPlugins,
        pluginsConfig
    });
    useEffect(() => {
        if (!loading && onMount) {
            onMount(true);
        }
    }, [ loading, onMount ]);
    const Loader = loaderComponent;
    return (
        <>
            <ConnectedPluginsContainer
                key="page-dashboard"
                id="page-dashboard"
                className="page page-dashboard"
                component={BorderLayout}
                pluginsConfig={pluginsConfig}
                plugins={{ ...loadedPlugins, ...plugins }}
                params={params}
                onPluginsLoaded={() => setLoading(false)}
            />
            {loading && Loader && <Loader />}
        </>
    );
}

DashboardRoute.propTypes = {
    onMount: PropTypes.func
};

const ConnectedDashboardRoute = connect(
    () => ({}),
    {
        onMount: updateUrlOnScroll
    }
)(DashboardRoute);

ConnectedDashboardRoute.displayName = 'ConnectedDashboardRoute';

export default ConnectedDashboardRoute;
