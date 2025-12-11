/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { mapSaveSelector as msMapSaveSelector } from '@mapstore/framework/selectors/mapsave';
import { layersSelector } from '@mapstore/framework/selectors/layers';

/*
 * this map save selector is extending the default properties available in the final map data blob
 * eg. availableStyles property
 */
export const mapSaveSelector = (state) => {
    const layersState = layersSelector(state);
    const { map, ...data } = msMapSaveSelector(state);
    return {
        ...data,
        map: {
            ...map,
            layers: (map?.layers || []).map((layer) => {
                const layerState = layersState.find((lState) => lState.id === layer.id);
                if (layerState) {
                    const { availableStyles } = layerState;
                    return {
                        ...layer,
                        availableStyles
                    };
                }
                return layer;
            })
        }
    };
};
