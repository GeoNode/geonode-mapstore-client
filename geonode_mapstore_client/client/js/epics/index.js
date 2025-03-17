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
import { getDatasetByName, getDatasetsByName, getDatasetByPk } from '@js/api/geonode/v2';
import { MAP_CONFIG_LOADED } from '@mapstore/framework/actions/config';
import { setPermission } from '@mapstore/framework/actions/featuregrid';
import { SELECT_NODE, updateNode, ADD_LAYER } from '@mapstore/framework/actions/layers';
import { setSelectedDatasetPermissions, setSelectedLayer, updateLayerDataset, setLayerDataset } from '@js/actions/gnresource';
import { updateMapLayoutEpic as msUpdateMapLayoutEpic } from '@mapstore/framework/epics/maplayout';
import isEmpty from 'lodash/isEmpty';

// We need to include missing epics. The plugins that normally include this epic is not used.

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
                    setSelectedDatasetPermissions(permissions),
                    setSelectedLayer(layer)
                )
                : Rx.Observable.of(
                    setPermission({canEdit: false}),
                    setEditPermissionStyleEditor(false),
                    setSelectedDatasetPermissions([]),
                    setSelectedLayer(null)
                );
        });

/**
 * Fetches missing values for selected layers
 */
export const gnFetchMissingLayerData = (action$, { getState } = {}) =>
    action$.ofType(SELECT_NODE)
        .filter(({ nodeType }) => nodeType && nodeType === "layer")
        .switchMap(() => {
            const state = getState() || {};
            const layer = getSelectedLayer(state);
            const layerResourceId = layer?.extendedParams?.pk;
            const layerResourceDataset = state.gnresource.data?.maplayers?.find(mapLayer => mapLayer.dataset?.pk === parseInt(layerResourceId, 10))?.dataset;
            return layerResourceDataset
                ? isEmpty(layerResourceDataset?.linkedResources)
                    ? Rx.Observable.defer(() =>
                        getDatasetByPk(layerResourceId)
                            .then((layerDataset) => layerDataset)
                            .catch(() => [])
                    ).switchMap((layerDataset) =>
                        Rx.Observable.of(
                            updateLayerDataset(layerDataset),
                            setLayerDataset(layerResourceId)
                        )
                    ).startWith(setLayerDataset())
                    : Rx.Observable.of(
                        setLayerDataset(layerResourceId)
                    )
                : Rx.Observable.of(
                    setLayerDataset()
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
                let layerNames = action.config?.map?.layers?.filter((l) =>
                    l?.group !== "background" && !!l?.extendedParams?.pk // skip layers of non-geonode origin
                )?.map((l) => l.name) ?? [];
                if (layerNames.length === 0) {
                    return Rx.Observable.empty();
                }
                return Rx.Observable.defer(() => getDatasetsByName(layerNames))
                    .switchMap((layers = []) => {
                        const stateLayers = layers.map((l) => ({
                            ...l,
                            id: layersSelector(getState())?.find((la) => la.name === l.alternate)?.id
                        }));
                        return Rx.Observable.of(...stateLayers.map((l) => updateNode(l.id, 'layer', {perms: l.perms || []}) ));
                    });
            }

            // skip layers of non-geonode origin
            if (!action.layer?.pk) return Rx.Observable.empty();

            return Rx.Observable.defer(() => getDatasetByName(action.layer?.name))
                .switchMap((layer = {}) => {
                    const layerId = layersSelector(getState())?.find((la) => la.name === layer.alternate)?.id;
                    return Rx.Observable.of(updateNode(layerId, 'layer', {perms: layer.perms}));
                });
        });

export const updateMapLayoutEpic = msUpdateMapLayoutEpic;

export default {
    gnCheckSelectedDatasetPermissions,
    updateMapLayoutEpic,
    gnSetDatasetsPermissions
};
