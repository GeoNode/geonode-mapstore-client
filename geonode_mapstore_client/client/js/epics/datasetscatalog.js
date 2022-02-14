/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SET_CONTROL_PROPERTY } from '@mapstore/framework/actions/controls';
import { updateMapLayout, UPDATE_MAP_LAYOUT } from '@mapstore/framework/actions/maplayout';
import { mapLayoutSelector } from '@mapstore/framework/selectors/maplayout';
import { getConfigProp } from "@mapstore/framework/utils/ConfigUtils";

/**
* @module epics/datasetcatalog
*/

/**
 * Override the layout to get the correct right offset when the data catalog is open
 */
export const gnUpdateDatasetsCatalogMapLayout = (action$, store) =>
    action$.ofType(UPDATE_MAP_LAYOUT, SET_CONTROL_PROPERTY)
        .filter(() => store.getState()?.controls?.datasetsCatalog?.enabled)
        .filter(({ source }) => {
            return source !== 'DatasetsCatalog';
        })
        .map(({ layout }) => {
            const mapLayout = getConfigProp('mapLayout') || { left: { sm: 300, md: 500, lg: 600 }, right: { md: 658 }, bottom: { sm: 30 } };
            const action = updateMapLayout({
                ...mapLayoutSelector(store.getState()),
                ...layout,
                right: mapLayout.right.md,
                boundingMapRect: {
                    ...(layout?.boundingMapRect || {}),
                    right: mapLayout.right.md
                }
            });
            return { ...action, source: 'DatasetsCatalog' }; // add an argument to avoid infinite loop.
        });

export default {
    gnUpdateDatasetsCatalogMapLayout
};
