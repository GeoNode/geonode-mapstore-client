/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import MockAdapter from 'axios-mock-adapter';
import axios from '@mapstore/framework/libs/ajax';
import { getMetadataSchema, getMetadataByPk } from '@js/api/geonode/v2/metadata';

let mockAxios;

const testSchema = {
    type: 'object',
    properties: {
        title: { type: 'string' },
        keywords: {
            type: 'object',
            properties: {
                'test-thesaurus': {
                    type: 'array',
                    title: 'Test Thesaurus',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            label: { type: 'string' }
                        }
                    },
                    'ui:options': {
                        'geonode-ui:autocomplete': '/api/v2/metadata/autocomplete/thesaurus/1/keywords'
                    },
                    minItems: 1
                }
            }
        }
    }
};

describe('GeoNode v2 metadata api', () => {
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

    it('should fetch and return schema with parsed uiSchema (getMetadataSchema)', (done) => {
        mockAxios.onGet(/\/api\/v2\/metadata\/schema/).reply(200, testSchema);

        getMetadataSchema()
            .then(({ schema, uiSchema }) => {
                try {
                    expect(schema).toExist();
                    expect(schema.properties.title).toExist();
                    expect(schema.properties.keywords).toExist();
                    expect(uiSchema).toExist();
                    expect(uiSchema.keywords['test-thesaurus']).toExist();
                    expect(uiSchema.keywords['test-thesaurus']['ui:options']['geonode-ui:autocomplete']).toBe(
                        '/api/v2/metadata/autocomplete/thesaurus/1/keywords'
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('should return cached schema on subsequent calls (getMetadataSchema)', (done) => {
        getMetadataSchema()
            .then(({ schema }) => {
                try {
                    expect(schema).toEqual(testSchema);
                    expect(mockAxios.history.get.filter(r => /schema/.test(r.url)).length).toBe(0);
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('should not pre-populate array fields with empty items when minItems >= 1 (getMetadataByPk)', (done) => {
        const pk = 1;

        mockAxios.onGet(/\/api\/v2\/metadata\/instance\/1/).reply(200, {
            title: 'Test Resource',
            keywords: {}
        });
        mockAxios.onGet(/\/api\/v2\/resources\/1/).reply(200, {
            resource: { pk: 1, title: 'Test Resource' }
        });

        getMetadataByPk(pk)
            .then(({ metadata }) => {
                try {
                    const items = metadata?.keywords?.['test-thesaurus'];
                    expect(!items || items.length === 0).toBe(true);
                    if (items) {
                        items.forEach((item) => {
                            expect(item).toNotEqual({});
                        });
                    }
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });
});
