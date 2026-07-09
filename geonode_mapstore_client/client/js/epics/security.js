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
    loadRequestsRulesError,
    SESSION_VALID,
    sessionValid,
    LOGOUT
} from '@mapstore/framework/actions/security';
import { getRequestRules } from '@js/api/geonode/security';
import { getUserInfo } from '@js/api/geonode/v2';
import {
    RULE_EXPIRED, ruleExpired,
    START_LOGIN_MONITORING,
    STOP_LOGIN_MONITORING,
    startLoginMonitoring, stopLoginMonitoring
} from '@js/actions/gnsecurity';
import { requestsRulesSelector, isLoggedIn, authProviderSelector } from '@mapstore/framework/selectors/security';
import { LOCATION_CHANGE } from 'connected-react-router';
import { getGeoNodeLocalConfig } from '@js/utils/APIUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { SESSION_MONITORING_DIALOG } from '@js/selectors/monitoring';

/**
* @module epics/security
*/

const RULE_EXPIRATION_CHECK_INTERVAL = 60 * 1000;
const DEFAULT_CHECK_SESSION_INTERVAL = 15 * 60 * 1000; // 15 minutes

const checkSessionInterval = getGeoNodeLocalConfig('geoNodeSettings.checkSessionInterval', DEFAULT_CHECK_SESSION_INTERVAL);

/**
 * Epic to fetch request configuration rules and update the store
 */
export const gnUpdateRequestConfigurationRulesEpic = (action$) =>
    action$.ofType(LOAD_REQUESTS_RULES, RULE_EXPIRED)
        .switchMap(() => {
            return Observable.defer(() => getRequestRules())
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

/**
 * Epic to monitor user session status and redirect to login if the session is expired server-side
 */
export const gnMonitorLogin = (action$) =>
    Observable.merge(
        action$.ofType(SESSION_VALID)
            .mapTo(startLoginMonitoring()),

        action$.ofType(LOGOUT)
            .mapTo(stopLoginMonitoring()),

        action$.ofType(START_LOGIN_MONITORING)
            .switchMap(() =>
                Observable.interval(checkSessionInterval)
                    .exhaustMap(() =>
                         Observable.fromPromise(getUserInfo())
                            .ignoreElements()
                            .catch(err => {
                                const status = err?.response?.status || err?.status;
                                if (status === 401) {
                                    return Observable.of(
                                        setControlProperty(SESSION_MONITORING_DIALOG, 'enabled', true),
                                        stopLoginMonitoring()
                                    );
                                }
                                return Observable.empty();
                            })
                    )
                    .takeUntil(action$.ofType(STOP_LOGIN_MONITORING))
            )
    );

/**
 * Epic to check session validity on every navigation and dispatch SESSION_VALID if the user is logged in.
 */
export const gnCheckSession = (action$, store) =>
    action$.ofType(LOCATION_CHANGE)
        .filter(() => checkSessionInterval !== 0 && !!isLoggedIn(store.getState()))
        .switchMap(() => {
            const authProvider = authProviderSelector(store.getState());
            return Observable.defer(() => getUserInfo())
                .map(data => sessionValid(data, authProvider))
                .catch(() => Observable.empty());
        });

export default {
    gnUpdateRequestConfigurationRulesEpic,
    gnRuleExpiredEpic,
    gnMonitorLogin,
    gnCheckSession
};
