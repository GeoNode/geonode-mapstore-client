/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const RULE_EXPIRED = 'GEONODE_SECURITY:RULE_EXPIRED';
export const START_LOGIN_MONITORING = 'GEONODE_SECURITY:START_LOGIN_MONITORING';
export const STOP_LOGIN_MONITORING = 'GEONODE_SECURITY:STOP_LOGIN_MONITORING';

export function ruleExpired() {
    return { type: RULE_EXPIRED };
}

export function startLoginMonitoring() {
    return { type: START_LOGIN_MONITORING };
}

export function stopLoginMonitoring() {
    return { type: STOP_LOGIN_MONITORING };
}
