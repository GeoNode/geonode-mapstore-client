

/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { Suspense, lazy } from 'react';
import { createPlugin } from "@mapstore/framework/utils/PluginsUtils";
const CreateDataset = lazy(() => import('./containers/CreateDataset'));

/**
 * Create a new dataset
 * @name CreateDataset
 * @memberof plugins
 */
const CreateDatasetPlugin = ({ props }) => {
    return (
        <Suspense fallback={null}>
            <CreateDataset {...props} />
        </Suspense>
    );
};

export default createPlugin('CreateDataset', {
    component: CreateDatasetPlugin,
    containers: {},
    epics: {},
    reducers: {}
});
