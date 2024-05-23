/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import isEmpty from 'lodash/isEmpty';
import { getLinkedResourcesByPk } from '@js/api/geonode/v2';
import {
    updateLayerResourceProperties,
    SET_LAYER_RESOURCE
} from '@js/actions/gnresource';
import { getLayerResourceData } from '@js/selectors/resource';

/**
 * Get linked resources for layer
 */
export const gnGetLayerLinkedResources = (action$, store) =>
    action$.ofType(SET_LAYER_RESOURCE)
        .filter((action) =>
            !action.pending && action.data?.pk && isEmpty(getLayerResourceData(store.getState())?.linkedResources)
        )
        .switchMap((action) =>
            Observable.defer(() =>
                getLinkedResourcesByPk(action.data.pk)
                    .then((linkedResources) => {
                        const linkedTo = linkedResources.linked_to ?? [];
                        const linkedBy = linkedResources.linked_by ?? [];
                        return isEmpty(linkedTo) && isEmpty(linkedBy) ? {} : ({ linkedTo, linkedBy });
                    })
                    .catch(() => [])
            ).switchMap((linkedResources) =>
                Observable.of(
                    updateLayerResourceProperties({linkedResources})
                )
            )
        );


export default {
    gnGetLayerLinkedResources
};