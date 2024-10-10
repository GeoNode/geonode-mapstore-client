/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import { addQueryPlugins } from '../AppUtils';

describe('Test AppUtils', () => {
    it('addQueryPlugins', () => {
        expect(addQueryPlugins({ map_viewer: [{ name: 'Map' }] })).toEqual({ map_viewer: [{ name: 'Map' }] });
        expect(addQueryPlugins([{ name: 'Map' }])).toEqual([{ name: 'Map' }]);
        expect(addQueryPlugins([{ name: 'Map' }], { allowFullscreen: 'true' })).toEqual([{
            mandatory: true,
            name: 'FullScreen',
            cfg: {
                showText: true
            }
        },
        {
            mandatory: true,
            name: 'ActionNavbar',
            cfg: {
                containerPosition: 'footer',
                variant: 'default',
                leftMenuItems: [{
                    type: 'placeholder'
                }],
                rightMenuItems: [
                    {
                        type: 'plugin',
                        name: 'FullScreen',
                        size: 'xs'
                    }
                ]
            }
        }, { name: 'Map' }] );
    });
});
