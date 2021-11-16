/**
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Epics needed to adapt mapstore2 to geonode backend
 */
import Rx from "rxjs";

import { setEditPermissionStyleEditor, INIT_STYLE_SERVICE } from "@mapstore/framework/actions/styleeditor";
import { getSelectedLayer, layersSelector } from "@mapstore/framework/selectors/layers";
import { getConfigProp } from "@mapstore/framework/utils/ConfigUtils";
import { getDatasetByName, getDatasetsByName } from '@js/api/geonode/v2';
import { updateMapLayout } from '@mapstore/framework/actions/maplayout';
import { TOGGLE_CONTROL, SET_CONTROL_PROPERTY, SET_CONTROL_PROPERTIES } from '@mapstore/framework/actions/controls';
import { MAP_CONFIG_LOADED } from '@mapstore/framework/actions/config';
import { SIZE_CHANGE, CLOSE_FEATURE_GRID, OPEN_FEATURE_GRID, setPermission } from '@mapstore/framework/actions/featuregrid';
import { CLOSE_IDENTIFY, ERROR_FEATURE_INFO, TOGGLE_MAPINFO_STATE, LOAD_FEATURE_INFO, EXCEPTIONS_FEATURE_INFO, PURGE_MAPINFO_RESULTS } from '@mapstore/framework/actions/mapInfo';
import { SHOW_SETTINGS, HIDE_SETTINGS, SELECT_NODE, updateNode, ADD_LAYER } from '@mapstore/framework/actions/layers';
import { isMapInfoOpen } from '@mapstore/framework/selectors/mapInfo';
import { setSelectedDatasetPermissions } from '@js/actions/gnresource';
import { isFeatureGridOpen, getDockSize } from '@mapstore/framework/selectors/featuregrid';
import head from 'lodash/head';
import get from 'lodash/get';


// We need to include missing epics. The plugins that normally include this epic is not used.

import { showCoordinateEditorSelector } from '@mapstore/framework/selectors/controls';

/**
* @module epics/index
*/

/**
 * Handles checking and for permissions of a layer when its selected
 */
export const gnCheckSelectedDatasetPermissions = (action$, { getState } = {}) =>
    action$.ofType(SELECT_NODE, INIT_STYLE_SERVICE)
        .filter(({ nodeType }) => nodeType && nodeType === "layer" && !getConfigProp("disableCheckEditPermissions")
        || !nodeType && !getConfigProp("disableCheckEditPermissions"))
        .switchMap(() => {
            const state = getState() || {};
            const layer = getSelectedLayer(state);
            const permissions = layer?.perms || [];
            const canEditStyles = permissions.includes("change_dataset_style");
            const canEdit = permissions.includes("change_dataset_data");
            return layer
                ? Rx.Observable.of(
                    setPermission({canEdit}),
                    setEditPermissionStyleEditor(canEditStyles),
                    setSelectedDatasetPermissions(permissions)
                )
                : Rx.Observable.of(
                    setPermission({canEdit: false}),
                    setEditPermissionStyleEditor(false),
                    setSelectedDatasetPermissions([])
                );
        });


/**
 * Checks the permissions for layers when a map is loaded and when a new layer is added
 * to a map
 */
export const gnSetDatasetsPermissions = (actions$, { getState = () => {}} = {}) =>
    actions$.ofType(MAP_CONFIG_LOADED, ADD_LAYER)
        .switchMap((action) => {
            if (action.type === MAP_CONFIG_LOADED) {
                const layerNames = action.config?.map?.layers?.filter((l) => l?.group !== "background").map((l) => l.name);
                return Rx.Observable.defer(() => getDatasetsByName(layerNames))
                    .switchMap((layers = []) => {
                        const stateLayers = layers.map((l) => ({
                            ...l,
                            id: layersSelector(getState())?.find((la) => la.name === l.alternate)?.id
                        }));
                        return Rx.Observable.of(...stateLayers.map((l) => updateNode(l.id, 'layer', {perms: l.perms || []}) ));
                    });
            }
            return Rx.Observable.defer(() => getDatasetByName(action.layer?.name))
                .switchMap((layer = {}) => {
                    const layerId = layersSelector(getState())?.find((la) => la.name === layer.alternate)?.id;
                    return Rx.Observable.of(updateNode(layerId, 'layer', {perms: layer.perms}));
                });
        });

// Modified to accept map-layout from Config diff less NO_QUERYABLE_LAYERS, SET_CONTROL_PROPERTIES more action$.ofType(PURGE_MAPINFO_RESULTS)
export const updateMapLayoutEpic = (action$, store) =>

    action$.ofType(MAP_CONFIG_LOADED, SIZE_CHANGE, SET_CONTROL_PROPERTIES, CLOSE_FEATURE_GRID, OPEN_FEATURE_GRID, CLOSE_IDENTIFY, TOGGLE_MAPINFO_STATE, LOAD_FEATURE_INFO, EXCEPTIONS_FEATURE_INFO, TOGGLE_CONTROL, SET_CONTROL_PROPERTY, SHOW_SETTINGS, HIDE_SETTINGS, ERROR_FEATURE_INFO, PURGE_MAPINFO_RESULTS)
        .switchMap(() => {
            const state = store.getState();

            if (get(state, "browser.mobile")) {
                const bottom = isMapInfoOpen(state) ? { bottom: '50%' } : { bottom: undefined };

                const boundingMapRect = {
                    ...bottom
                };
                return Rx.Observable.of(updateMapLayout({
                    boundingMapRect
                }));
            }

            const mapLayout = getConfigProp("mapLayout") || { left: { sm: 300, md: 500, lg: 600 }, right: { md: 658 }, bottom: { sm: 30 } };

            if (get(state, "mode") === 'embedded') {
                const height = { height: 'calc(100% - ' + mapLayout.bottom.sm + 'px)' };
                const bottom = isMapInfoOpen(state) ? { bottom: '50%' } : { bottom: undefined };
                const boundingMapRect = {
                    ...bottom
                };
                return Rx.Observable.of(updateMapLayout({
                    ...height,
                    boundingMapRect
                }));
            }

            const resizedDrawer = get(state, "controls.drawer.resizedWidth");

            const leftPanels = head([
                get(state, "controls.queryPanel.enabled") && { left: mapLayout.left.lg } || null,
                get(state, "controls.widgetBuilder.enabled") && { left: mapLayout.left.md } || null,
                get(state, "layers.settings.expanded") && { left: mapLayout.left.md } || null,
                get(state, "controls.drawer.enabled") && { left: resizedDrawer || mapLayout.left.sm } || null
            ].filter(panel => panel)) || { left: 0 };

            const rightPanels = head([
                get(state, "controls.details.enabled") && { right: mapLayout.right.md } || null,
                get(state, "controls.annotations.enabled") && { right: mapLayout.right.md / 2 } || null,
                get(state, "controls.metadataexplorer.enabled") && { right: mapLayout.right.md } || null,
                get(state, "controls.measure.enabled") && showCoordinateEditorSelector(state) && { right: mapLayout.right.md } || null,
                get(state, "mapInfo.enabled") && isMapInfoOpen(state) && { right: mapLayout.right.md } || null
            ].filter(panel => panel)) || { right: 0 };

            const dockSize = getDockSize(state) * 100;
            const bottom = isFeatureGridOpen(state) && { bottom: dockSize + '%', dockSize } || { bottom: mapLayout.bottom.sm };

            const transform = isFeatureGridOpen(state) && { transform: 'translate(0, -' + mapLayout.bottom.sm + 'px)' } || { transform: 'none' };
            const height = { height: 'calc(100% - ' + mapLayout.bottom.sm + 'px)' };

            const boundingMapRect = {
                ...bottom,
                ...leftPanels,
                ...rightPanels
            };

            return Rx.Observable.of(updateMapLayout({
                ...leftPanels,
                ...rightPanels,
                ...bottom,
                ...transform,
                ...height,
                boundingMapRect
            }));
        });
export default {
    gnCheckSelectedDatasetPermissions,
    updateMapLayoutEpic,
    gnSetDatasetsPermissions
};
