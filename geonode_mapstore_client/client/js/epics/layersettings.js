/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { updateMapLayout, UPDATE_MAP_LAYOUT } from '@mapstore/framework/actions/maplayout';
import { mapLayoutSelector, boundingSidebarRectSelector } from '@mapstore/framework/selectors/maplayout';
import { getConfigProp } from "@mapstore/framework/utils/ConfigUtils";
import { SHOW_SETTINGS } from '@mapstore/framework/actions/layers';
import { LayoutSections } from "@js/utils/LayoutUtils";
/**
* @module epics/layersetting
*/

/**
 * Override the layout to get the correct left offset when the layer settings panel is open
 */
export const gnUpdateLayerSettingsMapLayout = (action$, store) =>
    action$.ofType(UPDATE_MAP_LAYOUT, SHOW_SETTINGS)
        .filter(() => store.getState()?.layers?.settings?.expanded)
        .filter(({ source }) => {
            return source !== LayoutSections.PANEL;
        })
        .map(({ layout }) => {
            const mapLayout = getConfigProp('mapLayout') || { left: { sm: 300, md: 500, lg: 600 }, right: { md: 658 }, bottom: { sm: 30 } };
            const boundingSidebarRect = boundingSidebarRectSelector(store.getState());
            const action = updateMapLayout({
                ...mapLayoutSelector(store.getState()),
                ...layout,
                left: mapLayout.left.sm,
                boundingMapRect: {
                    ...(layout?.boundingMapRect || {}),
                    left: mapLayout.left.sm
                },
                boundingSideBarReact: {
                    ...boundingSidebarRect,
                    ...layout.boundingSidebarRect
                }
            });
            return { ...action, source: LayoutSections.PANEL }; // add an argument to avoid infinite loop.
        });

export default {
    gnUpdateLayerSettingsMapLayout
};
