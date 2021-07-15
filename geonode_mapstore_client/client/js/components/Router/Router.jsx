/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import Debug from '@mapstore/framework/components/development/Debug';
import { Route } from 'react-router';
import { ConnectedRouter } from 'connected-react-router';
import Localized from '@mapstore/framework/components/I18N/Localized';
import Theme from '@mapstore/framework/components/theme/Theme';
import { ErrorBoundary } from 'react-error-boundary';
import history from '@mapstore/framework/stores/History';
import ErrorFallback from '@js/components/ErrorFallback';

export const withRoutes = (routes) => (Component) => {
    const WithRoutes = forwardRef((props, ref) => {
        return <Component { ...props } routes={routes} ref={ref} />;
    });
    return WithRoutes;
};

function ThemeLoader({
    themeCfg,
    loaderComponent,
    children
}) {
    const [loading, setLoading] = useState(true);
    const Loader = loaderComponent;
    // explicit remove load theme
    if (themeCfg === null) {
        return children;
    }
    return (
        <Theme
            {...themeCfg}
            onLoad={() => setLoading(false)}
        >
            {loading
                ? <Loader />
                : children}
        </Theme>
    );
}

const Router = forwardRef(({
    id,
    plugins,
    locale,
    routes,
    className,
    pluginsConfig,
    themeCfg,
    loaderComponent,
    geoNodeConfiguration,
    lazyPlugins
}, ref) => {
    return (
        <>
            <ThemeLoader
                themeCfg={themeCfg}
                loaderComponent={loaderComponent}
            >
                <div
                    id={id}
                    className={className}
                    ref={ref}
                >
                    <Localized
                        messages={locale.messages}
                        locale={locale.current}
                        loadingError={locale.localeError}
                    >
                        <ConnectedRouter history={history}>
                            <ErrorBoundary
                                FallbackComponent={ErrorFallback}
                                onError={e => {
                                    console.error(e); // eslint-disable-line no-console
                                }}>
                                {routes.map((route, i) => {
                                    const routeConfig = route.pageConfig || {};
                                    const Component = route.component;
                                    return (
                                        <Route
                                            key={(route.name || route.path) + i}
                                            exact
                                            path={route.path}
                                            component={(props) =>
                                                <Component
                                                    {...props}
                                                    name={route.name}
                                                    lazyPlugins={lazyPlugins}
                                                    plugins={plugins}
                                                    pluginsConfig={pluginsConfig}
                                                    loaderComponent={loaderComponent}
                                                    geoNodeConfiguration={geoNodeConfiguration}
                                                    {...routeConfig}
                                                />}
                                        />
                                    );
                                })}
                            </ErrorBoundary>
                        </ConnectedRouter>
                    </Localized>
                    <Debug />
                </div>
            </ThemeLoader>
        </>
    );
});

Router.propTypes = {
    id: PropTypes.string,
    plugins: PropTypes.object,
    locale: PropTypes.object,
    className: PropTypes.string,
    pluginsConfig: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object
    ]),
    geoNodeConfiguration: PropTypes.object
};

Router.defaultProps = {
    id: 'ms-app',
    plugins: {},
    locale: {
        messages: {},
        current: 'en-US'
    },
    className: 'app-router fill',
    geoNodeConfiguration: {}
};

export default Router;
