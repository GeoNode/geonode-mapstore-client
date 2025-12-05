

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
* @module CreateDataset
*/

/**
 * Create new datasets with custom attributes and restrictions.
 * Also supports manual attribute creation or loading from JSON schema files.
 * @name CreateDataset
 * @example
 * // Sample JSON schema that can be loaded:
 * {
 *     "title": "My dataset",
 *     "type": "object",
 *     "properties": {
 *         "geom": {
 *             "const": "Point"
 *         },
 *         "string_attr": {
 *             "type": "string"
 *         },
 *         "string_attr_options": {
 *             "type": "string",
 *             "enum": ["A", "B", "C"]
 *         },
 *         "integer_attr": {
 *             "type": "integer"
 *         },
 *         "integer_attr_range": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 10
 *         },
 *         "integer_attr_options": {
 *             "type": "integer",
 *             "enum": [0, 1, 2]
 *         },
 *         "number_attr": {
 *             "type": "number"
 *         },
 *         "number_attr_range": {
 *             "type": "number",
 *             "minimum": 1.5,
 *             "maximum": 2.5
 *         },
 *         "number_attr_options": {
 *             "type": "integer",
 *             "enum": [0.5, 1.5, 2.5]
 *         },
 *         "date_attr": {
 *             "type": "string",
 *             "format": "date"
 *         }
 *     },
 *     "required": ["string_attr", "geom"]
 * }
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
