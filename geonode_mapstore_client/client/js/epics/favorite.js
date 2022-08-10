/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import {
    updateResourceProperties,
    SET_FAVORITE_RESOURCE
} from '@js/actions/gnresource';
import {
    updateResources
} from '@js/actions/gnsearch';
import {
    setFavoriteResource
} from '@js/api/geonode/v2';
import {
    error as errorNotification
} from '@mapstore/framework/actions/notifications';

export const gnSaveFavoriteContent = (action$, store) =>
    action$.ofType(SET_FAVORITE_RESOURCE)
        .switchMap((action) => {
            const state = store.getState();
            const pk = state?.gnresource?.data?.pk;
            const isFavoriteList = (state?.gnsearch?.params?.f?.includes('favorite')) ? true : false;
            const resource =  state?.gnresource?.data;
            const favorite =  action.favorite;
            const resources = store.getState().gnsearch?.resources || [];
            const newResources = isFavoriteList ? ((resources.some(item => item.pk === resource.pk)) ?
                resources.filter((item) => item.pk !== resource.pk)
                : [...resources, resource]) : resources;


            return Observable.concat(
                Observable.of(updateResourceProperties({'favorite': favorite})),
                Observable.defer(() => setFavoriteResource(pk, favorite))
                    .switchMap(() => {
                        return Observable.of(
                            updateResources(newResources, true)
                        );
                    })
                    .catch((error) => {
                        return Observable.of(
                            action.favorite ? updateResourceProperties({
                                'favorite': false
                            }) : updateResourceProperties({
                                'favorite': true
                            }),
                            errorNotification({ title: "gnviewer.cannotPerfomAction", message: error?.data?.message || error?.data?.detail || error?.originalError?.message || "gnviewer.syncErrorDefault" }));
                    })
            );

        });

export default {
    gnSaveFavoriteContent
};
