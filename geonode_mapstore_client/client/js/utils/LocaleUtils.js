/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


/**
* @module utils/LocaleUtils
*/

/**
 * Normalizes a locale code to a standard format (language-region).
 * If the locale code has a region, it returns the language-region combination.
 * Otherwise, it maximizes the locale to include region information.
 *
 * @param {string} code - The locale code to normalize (e.g., 'en', 'en-US', 'it')
 * @returns {string} The normalized locale code in language-region format, or an empty string if normalization fails
 *
 * @example
 * longLocale('en'); // Returns 'en-US' (or similar based on system locale)
 * longLocale('en-GB'); // Returns 'en-GB'
 * longLocale('invalid code'); // Returns ''
 *
 * shortLocale('en-US'); // Returns 'en'
 * shortLocale('it-IT'); // Returns 'it'
 * shortLocale('invalid code'); // Returns ''
 */

/**
 * return the normalized locale code in language-region format, 5 chars length e.g. 'en-US', 'it-IT'
 * @param {*} code
 * @returns {string} The normalized locale code in language-region format, or an empty string if normalization fails
 */
export function longLocale(code) {
    if (!code) return '';
    try {
        const loc = new Intl.Locale(code);
        if (loc.region) return `${loc.language}-${loc.region}`;
        const maximized = loc.maximize();
        return `${maximized.language}-${maximized.region}`;
    } catch {
        return '';
    }
}

/**
 * return the language component of a locale code, or an empty string if shortening fails, length is 2 chars e.g. 'en', 'it'
 * @param {string} code - The locale code to shorten (e.g., 'en-US', 'it-IT')
 * @returns {string} The language component of the locale code, or an empty string if shortening fails
 */
export function shortLocale(code) {
    if (!code) return '';
    try {
        const loc = new Intl.Locale(code);
        return loc.language;
    } catch {
        return '';
    }
}
