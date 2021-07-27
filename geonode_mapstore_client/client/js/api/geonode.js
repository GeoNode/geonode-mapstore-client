/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Rx from 'rxjs';
import axios from '@mapstore/framework/libs/ajax';
import { getConfigProp } from "@mapstore/framework/utils/ConfigUtils";

const getLayerEditPerimissions = (name) => {
    const { geonodeUrl = '/' } = getConfigProp('geoNodeSettings') || {};
    const baseUrl = geonodeUrl || "./";
    return axios.get(`${baseUrl}gs/${name}/edit-check`);
};
const getStyleEditPerimissions = (name) => {
    const { geonodeUrl = '/' } = getConfigProp('geoNodeSettings') || {};
    const baseUrl = geonodeUrl || "./";
    return axios.get(`${baseUrl}gs/${name}/style-check`);
};

/**
 * Retrieve layer's edit permission from local gs otherwise are false
 */
export const layerEditPermissions = (layer) =>
    Rx.Observable.defer(() => getLayerEditPerimissions(layer.name))
        .pluck("data")
        .map(({ authorized }) => ({ canEdit: authorized }));
export const styleEditPermissions = (layer) =>
    Rx.Observable.defer(() => getStyleEditPerimissions(layer.name))
        .pluck("data")
        .map(({ authorized }) => ({ canEdit: authorized }));

export default {
    layerEditPermissions,
    styleEditPermissions
};
