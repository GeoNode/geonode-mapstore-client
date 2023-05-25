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
    updateResourceProperties,
    SET_RESOURCE
} from '@js/actions/gnresource';
import { getResourceData } from '@js/selectors/resource';

/**
 * Get linked resources
 */
export const gnGetLinkedResources = (action$, store) =>
    action$.ofType(SET_RESOURCE)
        .filter((action) =>
            !action.pending && action.data?.pk && isEmpty(getResourceData(store.getState())?.linkedResources)
        )
        .switchMap((action) =>
            Observable.defer(() =>
                getLinkedResourcesByPk(action.data.pk)
                    .then((linkedResources) => linkedResources)
                    .catch(() => [])
            ).switchMap((linkedResources) =>
                Observable.of(
                    updateResourceProperties({linkedResources})
                )
            )
        );

export default {
    gnGetLinkedResources
};
