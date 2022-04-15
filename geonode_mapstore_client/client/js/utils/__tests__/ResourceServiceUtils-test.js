
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    ProcessTypes,
    extractExecutionsFromResources
} from '../ResourceServiceUtils';

describe('Test Resource Service Utils', () => {
    it('should extract executions from resources', () => {
        const executions = extractExecutionsFromResources([
            {
                pk: 1,
                executions: [
                    {
                        status_url: 'status_url',
                        user: 'admin',
                        func_name: 'copy'
                    },
                    {
                        status_url: 'status_url',
                        user: 'user',
                        func_name: 'copy'
                    },
                    {
                        status_url: 'status_url',
                        user: 'user'
                    }
                ]
            },
            {
                pk: 2,
                executions: []
            }
        ], 'admin');
        expect(executions).toEqual([{
            resource: {
                pk: 1,
                executions: [
                    {
                        status_url: 'status_url',
                        user: 'admin',
                        func_name: 'copy'
                    },
                    {
                        status_url: 'status_url',
                        user: 'user',
                        func_name: 'copy'
                    },
                    {
                        status_url: 'status_url',
                        user: 'user'
                    }
                ]
            },
            output: {
                status_url: 'status_url',
                user: 'admin',
                func_name: 'copy'
            },
            processType: ProcessTypes.COPY_RESOURCE
        }]);
    });
});
