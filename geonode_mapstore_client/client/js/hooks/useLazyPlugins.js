/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useEffect, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import { getPlugins } from '@mapstore/framework/utils/PluginsUtils';
import { augmentStore } from '@mapstore/framework/utils/StateUtils';
import join from 'lodash/join';

function filterRemoved(registry, removed = []) {
    return Object.keys(registry).reduce((acc, p) => {
        if (removed.indexOf(p) !== -1) {
            return acc;
        }
        return {
            ...acc,
            [p]: registry[p]
        };
    }, {});
}

const pluginsCache = {};
const epicsCache = {};
const reducersCache = {};

function useLazyPlugins({
    pluginsEntries = {},
    pluginsConfig = [],
    removed = []
}) {

    const [plugins, setPlugins] = useState({});
    const [pending, setPending] = useState(false);

    const pluginsKeys = pluginsConfig
        .map(({ name }) => name + 'Plugin')
        .filter((pluginName) => pluginsEntries[pluginName]);
    const pluginsString = join(pluginsKeys, ',');

    useEffect(() => {
        if (!pluginsCache[pluginsString]) {
            setPending(true);
            Promise.all(
                pluginsKeys.map(pluginName => {
                    return pluginsEntries[pluginName]().then((mod) => {
                        const impl = mod.default;
                        return impl;
                    });
                })
            )
                .then((impls) => {
                    const { reducers, epics } = pluginsKeys.reduce((acc, pluginName, idx) => {
                        const impl = impls[idx];
                        return {
                            reducers: {
                                ...acc.reducers,
                                ...impl.reducers
                            },
                            epics: {
                                ...acc.epics,
                                ...impl.epics
                            }
                        };
                    }, {
                        reducers: {},
                        epics: {}
                    });

                    // the epics and reducers once included in the store cannot be overridden
                    // so we need to filter out the one previously added and include only new one
                    const filterOutExistingEpics = Object.keys(epics)
                        .reduce((acc, key) => {
                            if (epicsCache[key]) {
                                return acc;
                            }
                            epicsCache[key] = true;
                            return {
                                ...acc,
                                [key]: epics[key]
                            };
                        }, {});


                    const filterOutExistingReducers = Object.keys(reducers)
                        .reduce((acc, key) => {
                            if (reducersCache[key]) {
                                return acc;
                            }
                            reducersCache[key] = true;
                            return {
                                ...acc,
                                [key]: reducers[key]
                            };
                        }, {});

                    if (!(isEmpty(filterOutExistingReducers) && isEmpty(filterOutExistingEpics))) {
                        augmentStore({
                            reducers: filterOutExistingReducers,
                            epics: filterOutExistingEpics
                        });
                    }

                    return pluginsKeys.map((pluginName, idx) => {
                        const { loadPlugin, enabler, ...impl } = impls[idx];
                        const pluginDef = {
                            [pluginName]: {
                                [pluginName]: {
                                    ...impl.containers,
                                    ...(enabler && { enabler }),
                                    loadPlugin: loadPlugin
                                        ? (resolve) => loadPlugin((component) => {
                                            resolve({ ...impl, component });
                                        })
                                        : (resolve) => {
                                            resolve(impl);
                                        }
                                }
                            }
                        };
                        return { plugin: pluginDef };
                    });
                })
                .then((loaded) => {
                    pluginsCache[pluginsString] = getPlugins(
                        {
                            ...filterRemoved(
                                loaded.reduce((previous, current) => ({ ...previous, ...current.plugin }), {}),
                                removed
                            )
                        }
                    );
                    setPlugins(pluginsCache[pluginsString]);
                    setPending(false);
                })
                .catch(() => {
                    setPlugins({});
                    setPending(false);
                });
        } else {
            setPlugins(pluginsCache[pluginsString]);
        }
    }, [ pluginsString ]);

    return { plugins, pending };
}

export default useLazyPlugins;
