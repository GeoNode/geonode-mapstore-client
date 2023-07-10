/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import { getGeoNodeLocalConfig, parseDevHostname } from "@js/utils/APIUtils";

/**
* Api for GeoNode user
* @name api.geonode.user
*/

export const getUserInfo = (apikey) => {
    const endpointV1 = getGeoNodeLocalConfig('geoNodeApi.endpointV1', '/api');
    return axios.get(`${parseDevHostname(endpointV1)}/o/v4/userinfo`, {
        params: {
            ...(apikey && { apikey })
        }
    })
        .then(({ data }) => data);
};
