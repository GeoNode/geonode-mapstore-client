/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import uuidv1 from 'uuid/v1';
import { updateNode, updateSettingsParams } from '@mapstore/framework/actions/layers';
import { updateStatus, UPDATE_STYLE_CODE, initStyleService } from '@mapstore/framework/actions/styleeditor';
import { setControlProperty, SET_CONTROL_PROPERTY } from '@mapstore/framework/actions/controls';
import { updateAdditionalLayer } from '@mapstore/framework/actions/additionallayers';
import { STYLE_OWNER_NAME } from '@mapstore/framework/utils/StyleEditorUtils';
import StylesAPI from '@mapstore/framework/api/geoserver/Styles';
import {
    styleServiceSelector,
    getUpdatedLayer
} from '@mapstore/framework/selectors/styleeditor';
import { REQUEST_DATASET_AVAILABLE_STYLES } from '@js/actions/visualstyleeditor';
import tinycolor from 'tinycolor2';
import { parseStyleName } from '@js/utils/ResourceUtils';
import { getStyleProperties } from '@js/api/geonode/style';
import { updateMapLayout, UPDATE_MAP_LAYOUT } from '@mapstore/framework/actions/maplayout';
import { mapLayoutSelector, boundingSidebarRectSelector } from '@mapstore/framework/selectors/maplayout';
import { getConfigProp } from "@mapstore/framework/utils/ConfigUtils";
import { LayoutSections } from "@js/utils/LayoutUtils";

/**
* @module epics/visualstyleeditor
*/

function getBaseCSSStyle({ type, title }) {
    const color = tinycolor(`hsl(${Math.floor(Math.random() * 270)}, 90%, 70%)`).toHexString();
    switch (type) {
    case 'raster': {
        return '@mode \'Flat\'; @styleTitle \'' + title + '\'; \n* {\n\traster-channels: auto;\n\traster-opacity: 1;\n}\n';
    }
    case 'point': {
        return '@mode \'Flat\'; @styleTitle \'' + title + '\'; \n* {\n\tmark: symbol(\'square\');\n\t:mark {\n\t\tfill: ' + color + ';\n\t\tsize: 4;\n\t}\n}\n';
    }
    case 'linestring': {
        return '@mode \'Flat\'; @styleTitle \'' + title + '\'; \n* {\n\tstroke: ' + color + ';\n}\n';
    }
    case 'polygon': {
        return '@mode \'Flat\'; @styleTitle \'' + title + '\'; \n* {\n\tfill: ' + color + ';\n}\n';
    }
    default:
        return '@mode \'Flat\'; @styleTitle \'' + title + '\'; \n* {\n\tmark: symbol(\'square\');\n\t:mark {\n\t\tfill: ' + color + ';\n\t\tsize: 4;\n\t}\n}\n';
    }
}

function getStyleId({ name }) {
    // geonode allows to create styles with this structure {uuid}_ms_{*}
    return `geonode:${uuidv1()}_ms_${name}`;
}

/**
 * Get Mapstore style in JSON, editor type and code for layer style in Promise
 * @param {Object} style layer default style
 * @param {Object} styleService Object containing baseUrl for getStylesInfo
 * @returns {Promise}
 */
function getGnStyleQueryParams(style, styleService) {

    let code;
    let msEditorType = 'visual';
    let msStyleJSON = null;

    if (!style) {
        return new Promise(resolve => resolve({ msStyleJSON, msEditorType, code }));
    }

    return getStyleProperties({
        baseUrl: styleService?.baseUrl,
        styleName: parseStyleName(style)
    })
        .then(updatedStyle => {
            const { metadata = {}, code: updateStyleCode, format, languageVersion } = updatedStyle || {};
            return {
                msEditorType: metadata?.msEditorType,
                msStyleJSON: metadata?.msStyleJSON,
                code: updateStyleCode,
                format,
                languageVersion
            };
        })
        .catch(() => ({ msEditorType, msStyleJSON, code}));
}

function getGeoNodeStyles({ layer, styleService }) {
    const geometryType = layer?.extendedParams?.mapLayer?.dataset?.subtype;
    const styles = layer?.availableStyles || [];
    if (styles.length === 0) {
        const defaultStyle = layer?.extendedParams?.mapLayer?.dataset?.default_style;
        return getGnStyleQueryParams(defaultStyle, styleService).then((defaultStyleInfo) => {
            const { msEditorType, msStyleJSON, code, format, languageVersion } = defaultStyleInfo || {};
            const layerParts = layer.name.split(':');
            const layerName = layerParts.length === 1 ? layerParts[0] : layerParts[layerParts.length - 1];
            const styleName = getStyleId({ name: layerName });
            const metadata = {
                title: layerName,
                description: '',
                msStyleJSON: msStyleJSON,
                msEditorType: msEditorType,
                gnDatasetPk: layer?.extendedParams?.mapLayer?.dataset?.pk
            };
            return StylesAPI.createStyle({
                baseUrl: styleService?.baseUrl,
                code: code || getBaseCSSStyle({ type: geometryType, title: layerName }),
                format: (code && format) ? format : 'css',
                styleName,
                metadata,
                options: { params: { raw: true } },
                ...((code && format) && { languageVersion })
            })
                .then(() => {
                    return [[{ name: styleName, title: layerName, metadata, format }], true];
                });
        });

    }
    return new Promise((resolve) => resolve([styles]));
}

export const gnRequestDatasetAvailableStyles = (action$, store) =>
    action$.ofType(REQUEST_DATASET_AVAILABLE_STYLES)
        .switchMap((action) => {
            const state = store.getState();
            const styleService = action?.options?.styleService || styleServiceSelector(state);
            return Observable.concat(
                Observable.of(
                    setControlProperty('visualStyleEditor', 'enabled', true),
                    initStyleService(styleService, {
                        editingAllowedRoles: ['ALL'],
                        editingAllowedGroups: []
                    })
                ),
                Observable.defer(() => getGeoNodeStyles({ layer: action.layer, styleService }))
                    .switchMap(([styles]) => {
                        const style = action?.options?.style || styles?.[0]?.name;
                        return Observable.concat(
                            Observable.defer(() => StylesAPI.getStylesInfo({
                                baseUrl: styleService?.baseUrl,
                                styles
                            }))
                                .switchMap((availableStyles) => {
                                    return Observable.of(
                                        updateNode(action.layer.id, 'layer', { availableStyles }),
                                        updateSettingsParams({ style }, true),
                                        updateAdditionalLayer(action.layer.id, STYLE_OWNER_NAME, 'override', {}),
                                        updateStatus('edit')
                                    );
                                })
                        );
                    })
            );
        });

export const gnUpdateStyleInfoOnSave = (action$, store) =>
    action$.ofType(UPDATE_STYLE_CODE)
        .switchMap(() => {
            const state = store.getState();
            const updatedLayer = getUpdatedLayer(state);
            return Observable.of(updateNode(updatedLayer.id, 'layers', { style: updatedLayer.style }));
        });

/**
 * Override the layout to get the correct left offset when the visual style editor is open
 */
export const gnUpdateVisualStyleEditorMapLayout = (action$, store) =>
    action$.ofType(UPDATE_MAP_LAYOUT, SET_CONTROL_PROPERTY)
        .filter(() => store.getState()?.controls?.visualStyleEditor?.enabled)
        .filter(({ source }) => {
            return source !== LayoutSections.PANEL;
        })
        .map(({ layout }) => {
            const mapLayout = getConfigProp('mapLayout') || { left: { sm: 300, md: 500, lg: 600 }, right: { md: 658 }, bottom: { sm: 30 } };
            const boundingSidebarRect = boundingSidebarRectSelector(store.getState());
            const action = updateMapLayout({
                ...mapLayoutSelector(store.getState()),
                ...layout,
                left: mapLayout.left.md,
                boundingMapRect: {
                    ...(layout?.boundingMapRect || {}),
                    left: mapLayout.left.md
                },
                boundingSidebarRect: {
                    ...boundingSidebarRect,
                    ...layout.boundingSidebarRect
                }
            });
            return { ...action, source: LayoutSections.PANEL }; // add an argument to avoid infinite loop.
        });

export default {
    gnRequestDatasetAvailableStyles,
    gnUpdateStyleInfoOnSave,
    gnUpdateVisualStyleEditorMapLayout
};
