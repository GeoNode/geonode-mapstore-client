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

const RULE_EXPIRATION_CHECK_INTERVAL = 60 * 1000;

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
 * @param {string|number} expires - ISO date string or Unix timestamp (in seconds)
 * @param {number} warningThreshold - Milliseconds before expiration to trigger warning (default: 5 minutes)
 * @returns {boolean}
 */
const isRuleExpiredOrExpiring = (expires, warningThreshold = 300000) => {
    if (!expires) {
        return false;
    }
    // Handle Unix timestamp (in seconds) - convert to milliseconds
    const expirationDate = typeof expires === 'number'
        ? new Date(expires * 1000)
        : new Date(expires);
    const now = new Date();
    const timeUntilExpiration = expirationDate.getTime() - now.getTime();
    return timeUntilExpiration <= warningThreshold;
};

/**
 * Epic to check if request configuration rules have expired or are about to expire
 * Periodically checks every minute when rules are expired and triggers API refresh
 */
export const gnRuleExpiredEpic = (action$, store) => {
    let lastRefreshTime = 0;
    return action$.ofType(UPDATE_REQUESTS_RULES)
        .switchMap(() => {
            lastRefreshTime = Date.now();
            return Observable.interval(60 * 1000)
                .startWith(0)
                .filter(() => {
                    const rules = requestsRulesSelector(store.getState());
                    const expired = rules.some((rule) => isRuleExpiredOrExpiring(rule.expires));
                    const now = Date.now();
                    const ready = expired && (now - lastRefreshTime >= RULE_EXPIRATION_CHECK_INTERVAL);
                    return ready;
                })
                .map(() => ruleExpired())
                .takeUntil(action$.ofType(UPDATE_REQUESTS_RULES));
        });
};

export default {
    gnUpdateRequestConfigurationRulesEpic,
    gnRuleExpiredEpic
};
