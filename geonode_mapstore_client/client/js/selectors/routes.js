/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

// get location url from state
export const getLocation = (state) => {
    const currentLocation = state?.router?.location?.pathname || '';
    return currentLocation;
};
