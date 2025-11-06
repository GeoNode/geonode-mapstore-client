/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import uniqBy from 'lodash/uniqBy';
import {
    LOAD_REQUESTS_RULES,
    UPDATE_REQUESTS_RULES,
    updateRequestsRules,
    loadRequestsRulesError
} from '@mapstore/framework/actions/security';
import { getRequestConfigurationRulesByUserPK } from '@js/api/geonode/security';
import { RULE_EXPIRED, ruleExpired } from '@js/actions/gnsecurity';
import { userSelector, requestsRulesSelector } from '@mapstore/framework/selectors/security';

/**
* @module epics/security
*/

/**
 * Epic to fetch request configuration rules and update the store
 */
export const gnUpdateRequestConfigurationRulesEpic = (action$, store) =>
    action$.ofType(LOAD_REQUESTS_RULES, RULE_EXPIRED)
        .switchMap(() => {
            const userPk = userSelector(store.getState())?.pk;
            if (!userPk) {
                return Observable.empty();
            }
            return Observable.defer(() => getRequestConfigurationRulesByUserPK(userPk))
                .switchMap((data) => {
                    const uniqRules = uniqBy(data.rules ?? [], 'urlPattern');
                    return Observable.of(updateRequestsRules(uniqRules));
                })
                .catch((error) => Observable.of(loadRequestsRulesError(error)));
        });

/**
 * Helper function to check if a rule has expired or is about to expire
 * @param {string} expires - ISO date string
 * @param {number} warningThreshold - Milliseconds before expiration to trigger warning (default: 5 minutes)
 * @returns {boolean}
 */
const isRuleExpiredOrExpiring = (expires, warningThreshold = 300000) => {
    if (!expires) {
        return false;
    }
    const expirationDate = new Date(expires);
    const now = new Date();
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();
    return timeUntilExpiration <= warningThreshold;
};

/**
 * Epic to check if request configuration rules have expired or are about to expire
 * Monitors rules when they're updated and sets up periodic checks
 */
export const gnRuleExpiredEpic = (action$, store) => {
    // Check rules immediately when they're updated
    const checkOnUpdate$ = action$
        .ofType(UPDATE_REQUESTS_RULES)
        .map(({ rules: rulesData }) => {
            const rules = rulesData?.rules || (Array.isArray(rulesData) ? rulesData : []);
            const hasExpiredRule = rules.some((rule) => isRuleExpiredOrExpiring(rule.expires));
            return hasExpiredRule;
        })
        .filter((hasExpired) => hasExpired)
        .map(() => ruleExpired());

    // Set up periodic check every minute to catch expiring rules
    const periodicCheck$ = action$
        .ofType(UPDATE_REQUESTS_RULES)
        .switchMap(() => {
            return Observable.interval(60 * 1000) // Check every minute
                .startWith(0) // Check immediately
                .map(() => {
                    const state = store.getState();
                    const rulesData = requestsRulesSelector(state);
                    const rules = rulesData?.rules || (Array.isArray(rulesData) ? rulesData : []);
                    return rules.some((rule) => isRuleExpiredOrExpiring(rule.expires));
                })
                .distinctUntilChanged() // Only emit when value changes
                .filter((hasExpired) => hasExpired)
                .map(() => ruleExpired())
                .takeUntil(action$.ofType(UPDATE_REQUESTS_RULES)); // Stop when rules are updated
        });

    return Observable.merge(checkOnUpdate$, periodicCheck$);
};

export default {
    gnUpdateRequestConfigurationRulesEpic,
    gnRuleExpiredEpic
};
