/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from '@mapstore/framework/libs/ajax';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';

/**
* Api for GeoNode user
* @name api.geonode.user
*/

export const getUserInfo = () => {
    const { endpointV1 = '/api' } = getConfigProp('geoNodeApi') || {};
    var url = `${endpointV1}/o/v4/userinfo`
    return axios.get(addApiTokenIfNeeded(url))
        .then(({ data }) => data);
};


export const addApiTokenIfNeeded = (url) => {
    const geoNodePageConfig = window.__GEONODE_CONFIG__ || {};
    const apikey = geoNodePageConfig.apikey || null;

    /*
    In case of LOCKDOWN_MODE in geonode, we need to check if the search page
    contains an APIKEY. This is required because otherwise the endpoint
    will always raise an error due the missing auth. In this way if the
    main call provide an apikey, we can proceed with the login
    */

    if (geoNodePageConfig.apikey) {
        url += '?apikey=' + geoNodePageConfig.apikey
    }

    return url
}