/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import { testEpic } from '@mapstore/framework/epics/__tests__/epicTestUtils';
import {
    LOAD_REQUESTS_RULES,
    UPDATE_REQUESTS_RULES,
    updateRequestsRules,
    loadRequestsRulesError
} from '@mapstore/framework/actions/security';
import { RULE_EXPIRED, ruleExpired } from '@js/actions/gnsecurity';
import {
    gnUpdateRequestConfigurationRulesEpic,
    gnRuleExpiredEpic
} from '../security';

let mockAxios;

describe('security epics', () => {
    beforeEach(done => {
        global.__DEVTOOLS__ = true;
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });

    afterEach(done => {
        delete global.__DEVTOOLS__;
        mockAxios.restore();
        setTimeout(done);
    });

    describe('gnUpdateRequestConfigurationRulesEpic', () => {
        it('should fetch and update rules when LOAD_REQUESTS_RULES is dispatched with valid user', (done) => {
            const NUM_ACTIONS = 1;
            const userPk = 1;
            const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
            const mockRules = {
                rules: [
                    {
                        urlPattern: 'http://localhost/geoserver//.*',
                        params: {
                            access_token: 'token123'
                        }
                    },
                    {
                        urlPattern: 'localhost/gs.*',
                        params: {
                            access_token: 'token456'
                        },
                        expires: futureDate
                    }
                ]
            };

            const testState = {
                security: {
                    user: {
                        pk: userPk
                    }
                }
            };

            mockAxios.onGet(new RegExp(`/api/v2/users/${userPk}/rules`)).reply(200, mockRules);

            testEpic(
                gnUpdateRequestConfigurationRulesEpic,
                NUM_ACTIONS,
                { type: LOAD_REQUESTS_RULES },
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(UPDATE_REQUESTS_RULES);
                        expect(actions[0].rules).toEqual(mockRules.rules);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should fetch and update rules when RULE_EXPIRED is dispatched', (done) => {
            const NUM_ACTIONS = 1;
            const userPk = 1;
            const mockRules = {
                rules: [
                    {
                        urlPattern: 'http://localhost/geoserver//.*',
                        params: {
                            access_token: 'token123'
                        }
                    }
                ]
            };

            const testState = {
                security: {
                    user: {
                        pk: userPk
                    }
                }
            };

            mockAxios.onGet(new RegExp(`/api/v2/users/${userPk}/rules`)).reply(200, mockRules);

            testEpic(
                gnUpdateRequestConfigurationRulesEpic,
                NUM_ACTIONS,
                ruleExpired(),
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(UPDATE_REQUESTS_RULES);
                        expect(actions[0].rules).toEqual(mockRules.rules);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should return empty observable when userPk is not available', (done) => {
            const NUM_ACTIONS = 0;
            const testState = {
                security: {
                    user: null
                }
            };

            testEpic(
                gnUpdateRequestConfigurationRulesEpic,
                NUM_ACTIONS,
                { type: LOAD_REQUESTS_RULES },
                (actions) => {
                    try {
                        expect(actions.length).toBe(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should handle API error and dispatch loadRequestsRulesError', (done) => {
            const NUM_ACTIONS = 1;
            const userPk = 1;
            const testState = {
                security: {
                    user: {
                        pk: userPk
                    }
                }
            };

            mockAxios.onGet(new RegExp(`/api/v2/users/${userPk}/rules`)).reply(500, { error: 'Server error' });

            testEpic(
                gnUpdateRequestConfigurationRulesEpic,
                NUM_ACTIONS,
                { type: LOAD_REQUESTS_RULES },
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(loadRequestsRulesError().type);
                        expect(actions[0].error).toBeTruthy();
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should deduplicate rules by urlPattern', (done) => {
            const NUM_ACTIONS = 1;
            const userPk = 1;
            const mockRules = {
                rules: [
                    {
                        urlPattern: 'http://localhost/geoserver//.*',
                        params: {
                            access_token: 'token123'
                        }
                    },
                    {
                        urlPattern: 'http://localhost/geoserver//.*',
                        params: {
                            access_token: 'token456'
                        }
                    },
                    {
                        urlPattern: 'localhost/gs.*',
                        params: {
                            access_token: 'token789'
                        }
                    }
                ]
            };

            const testState = {
                security: {
                    user: {
                        pk: userPk
                    }
                }
            };

            mockAxios.onGet(new RegExp(`/api/v2/users/${userPk}/rules`)).reply(200, mockRules);

            testEpic(
                gnUpdateRequestConfigurationRulesEpic,
                NUM_ACTIONS,
                { type: LOAD_REQUESTS_RULES },
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(UPDATE_REQUESTS_RULES);
                        // Should have only 2 unique rules (duplicate removed)
                        expect(actions[0].rules.length).toBe(2);
                        expect(actions[0].rules[0].urlPattern).toBe('http://localhost/geoserver//.*');
                        expect(actions[0].rules[1].urlPattern).toBe('localhost/gs.*');
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should handle empty rules array', (done) => {
            const NUM_ACTIONS = 1;
            const userPk = 1;
            const mockRules = {
                rules: []
            };

            const testState = {
                security: {
                    user: {
                        pk: userPk
                    }
                }
            };

            mockAxios.onGet(new RegExp(`/api/v2/users/${userPk}/rules`)).reply(200, mockRules);

            testEpic(
                gnUpdateRequestConfigurationRulesEpic,
                NUM_ACTIONS,
                { type: LOAD_REQUESTS_RULES },
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(UPDATE_REQUESTS_RULES);
                        expect(actions[0].rules).toEqual([]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });
    });

    describe('gnRuleExpiredEpic', () => {
        it('should dispatch ruleExpired when rules contain expired rule', (done) => {
            const NUM_ACTIONS = 1;
            const expiredDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
            const rulesArray = [
                {
                    urlPattern: 'http://localhost/geoserver//.*',
                    params: {
                        access_token: 'token123'
                    },
                    expires: expiredDate
                }
            ];

            const testState = {
                security: {
                    rules: rulesArray
                }
            };

            testEpic(
                gnRuleExpiredEpic,
                NUM_ACTIONS,
                updateRequestsRules(rulesArray),
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(RULE_EXPIRED);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should dispatch ruleExpired when rules contain expiring rule (within 5 minutes)', (done) => {
            const NUM_ACTIONS = 1;
            const expiringDate = new Date(Date.now() + 4 * 60 * 1000).toISOString(); // 4 minutes from now
            const rulesArray = [
                {
                    urlPattern: 'http://localhost/geoserver//.*',
                    params: {
                        access_token: 'token123'
                    },
                    expires: expiringDate
                }
            ];

            const testState = {
                security: {
                    rules: rulesArray
                }
            };

            testEpic(
                gnRuleExpiredEpic,
                NUM_ACTIONS,
                updateRequestsRules(rulesArray),
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(RULE_EXPIRED);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should not dispatch ruleExpired when rules do not contain expired or expiring rules', (done) => {
            const NUM_ACTIONS = 0;
            const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now
            const rulesArray = [
                {
                    urlPattern: 'http://localhost/geoserver//.*',
                    params: {
                        access_token: 'token123'
                    },
                    expires: futureDate
                }
            ];

            const testState = {
                security: {
                    rules: rulesArray
                }
            };

            testEpic(
                gnRuleExpiredEpic,
                NUM_ACTIONS,
                updateRequestsRules(rulesArray),
                (actions) => {
                    try {
                        expect(actions.length).toBe(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should not dispatch ruleExpired when rules have no expires field', (done) => {
            const NUM_ACTIONS = 0;
            const rulesArray = [
                {
                    urlPattern: 'http://localhost/geoserver//.*',
                    params: {
                        access_token: 'token123'
                    }
                }
            ];

            const testState = {
                security: {
                    rules: rulesArray
                }
            };

            testEpic(
                gnRuleExpiredEpic,
                NUM_ACTIONS,
                updateRequestsRules(rulesArray),
                (actions) => {
                    try {
                        expect(actions.length).toBe(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should handle rules as direct array format', (done) => {
            const NUM_ACTIONS = 1;
            const expiredDate = new Date(Date.now() - 1000).toISOString();
            const rulesArray = [
                {
                    urlPattern: 'http://localhost/geoserver//.*',
                    params: {
                        access_token: 'token123'
                    },
                    expires: expiredDate
                }
            ];

            const testState = {
                security: {
                    rules: rulesArray
                }
            };

            testEpic(
                gnRuleExpiredEpic,
                NUM_ACTIONS,
                updateRequestsRules(rulesArray),
                (actions) => {
                    try {
                        expect(actions.length).toBe(1);
                        expect(actions[0].type).toBe(RULE_EXPIRED);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });

        it('should handle empty rules array', (done) => {
            const NUM_ACTIONS = 0;
            const rulesArray = [];

            const testState = {
                security: {
                    rules: []
                }
            };

            testEpic(
                gnRuleExpiredEpic,
                NUM_ACTIONS,
                updateRequestsRules(rulesArray),
                (actions) => {
                    try {
                        expect(actions.length).toBe(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                testState
            );
        });
    });
});

