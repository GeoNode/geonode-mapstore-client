/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const RULE_EXPIRED = 'GEONODE_SECURITY:RULE_EXPIRED';

export function ruleExpired() {
    return {
        type: RULE_EXPIRED
    };
}
