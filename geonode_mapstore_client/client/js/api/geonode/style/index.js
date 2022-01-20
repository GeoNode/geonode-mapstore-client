/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    getStyleCodeByName,
    updateStyle
} from '@mapstore/framework/api/geoserver/Styles';

export function getStyleProperties({ baseUrl, styleName }) {
    return import('md5').then((mod) => {
        const md5 = mod.default;
        return getStyleCodeByName({
            baseUrl,
            styleName
        })
            .then((style) => {
                const {
                    msForceVisual,
                    ...metadata
                } = style?.metadata || {};
                if (!msForceVisual || msForceVisual === '') {
                    return style;
                }
                // force use of visual style editor with msForceVisual
                // and remove the true value
                const updatedMetadata = {
                    ...metadata,
                    msForceVisual: '',
                    msEditorType: 'visual',
                    msStyleJSON: '',
                    msMD5Hash: md5(style?.code)
                };
                return updateStyle({
                    ...style,
                    baseUrl,
                    styleName,
                    metadata: updatedMetadata,
                    options: {
                        params: {
                            raw: true
                        }
                    }
                }).then(() => ({ ...style, metadata: updatedMetadata }));
            });
    });
}
