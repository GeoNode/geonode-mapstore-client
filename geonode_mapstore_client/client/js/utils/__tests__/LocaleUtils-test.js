/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import expect from 'expect';
import {
    longLocale,
    shortLocale
} from '@js/utils/LocaleUtils';

describe('LocaleUtils', () => {
    it('longLocale should return language-region format', () => {
        expect(longLocale('en')).toMatch(/en-[A-Z]{2}/);
        expect(longLocale('en-GB')).toBe('en-GB');
        expect(longLocale('invalid code')).toBe('');
    });
    it('shortLocale should return the language component of a locale code', () => {
        expect(shortLocale('en-US')).toBe('en');
        expect(shortLocale('it-IT')).toBe('it');
        expect(shortLocale('invalid code')).toBe('');
    });
});
