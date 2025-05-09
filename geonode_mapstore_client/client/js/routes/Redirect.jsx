/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import isEmpty from 'lodash/isEmpty';
import { getGeoNodeLocalConfig } from '@js/utils/APIUtils';

function RedirectRoute({
    location
}) {
    const search = location?.search ?? {};
    const catalogHomeRedirectsTo = getGeoNodeLocalConfig('geoNodeSettings.catalogHomeRedirectsTo');
    if (!isEmpty(catalogHomeRedirectsTo)) {
        window.location.href = `${catalogHomeRedirectsTo}#/${search ? search : ""}`;
        return null;
    }
    return null;
}

RedirectRoute.propTypes = {};

const ConnectedRedirectRoute = connect(
    createSelector([], () => ({})),
    {}
)(RedirectRoute);

ConnectedRedirectRoute.displayName = 'ConnectedRedirectRoute';

export default ConnectedRedirectRoute;
