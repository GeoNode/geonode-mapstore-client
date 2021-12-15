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
import { updateStatus, UPDATE_STYLE_CODE } from '@mapstore/framework/actions/styleeditor';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { updateAdditionalLayer } from '@mapstore/framework/actions/additionallayers';
import { STYLE_OWNER_NAME } from '@mapstore/framework/utils/StyleEditorUtils';
import StylesAPI from '@mapstore/framework/api/geoserver/Styles';
import {
    styleServiceSelector,
    getUpdatedLayer,
    geometryTypeSelector
} from '@mapstore/framework/selectors/styleeditor';
import {
    CREATE_GEONODE_STYLE,
    DELETE_GEONODE_STYLE,
    REQUEST_DATASET_AVAILABLE_STYLES
} from '@js/actions/visualstyleeditor';
import { saveDirectContent } from '@js/actions/gnsave';
import tinycolor from 'tinycolor2';
import { isNewResource } from '@js/selectors/resource';
import { parseStyleName } from '@js/utils/ResourceUtils';

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
        return new Promise(resolve => resolve([{ metadata: { msStyleJSON, msEditorType }, code}]));
    }

    return StylesAPI.getStylesInfo({
        baseUrl: styleService?.baseUrl,
        styles: [{ name: parseStyleName(style) }]
    }).then(updatedStyles => {
      const { metadata = {}, code: updateStyleCode } = updatedStyles?.[0]|| {};
      return { msEditorType, msStyleJSON, ...metadata, code: updateStyleCode };
    }).catch(() => ({ msEditorType, msStyleJSON, code}));
}

function getGeoNodeStyles({ layer, styleService }) {
    const geometryType = layer?.extendedParams?.mapLayer?.dataset?.subtype;
    const styles = layer?.availableStyles || [];
    if (styles.length === 0) {
        const defaultStyle = layer?.extendedParams?.mapLayer?.dataset?.default_style;
        return getGnStyleQueryParams(defaultStyle, styleService).then((updatedStyles) => {
            if (updatedStyles?.[0]?.metadata) {
                ({ msEditorType, msStyleJSON } = updatedStyles[0].metadata);
                ({ code } = updatedStyles[0]);
            }
            const layerParts = layer.name.split(':');
            const layerName = layerParts.length === 1 ? layerParts[0] : layerParts[layerParts.length - 1];
            const styleName = getStyleId({ name: layerName });
            const metadata = {
                title: layerName,
                description: '',
                msStyleJSON: msStyleJSON || null,
                msEditorType: msEditorType || 'visual',
                gnDatasetPk: layer?.extendedParams?.mapLayer?.dataset?.pk
            };
            const format = 'css';
            return StylesAPI.createStyle({
                baseUrl: styleService?.baseUrl,
                code: code || getBaseCSSStyle({ type: geometryType, title: layerName }),
                format,
                styleName,
                metadata
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
            return Observable.defer(() => getGeoNodeStyles({ layer: action.layer, styleService }))
                .switchMap(([styles, update]) => {
                    const style = styles?.[0]?.name;
                    return Observable.concat(
                        Observable.of(setControlProperty('visualStyleEditor', 'enabled', true)),
                        Observable.defer(() => StylesAPI.getStylesInfo({
                            baseUrl: styleService?.baseUrl,
                            styles
                        }))
                            .switchMap((availableStyles) => {
                                return Observable.of(
                                    updateNode(action.layer.id, 'layer', { availableStyles }),
                                    updateSettingsParams({ style }, true),
                                    updateAdditionalLayer(action.layer.id, STYLE_OWNER_NAME, 'override', {}),
                                    updateStatus('edit'),
                                    ...(update && !isNewResource(state)  ? [saveDirectContent()] : [])
                                );
                            })
                    );
                });
        });

export const gnCreateStyle = (action$, store) =>
    action$.ofType(CREATE_GEONODE_STYLE)
        .switchMap((action) => {
            const state = store.getState();
            const styleService = action?.options?.styleService || styleServiceSelector(state);
            const styleName = getStyleId({ name: action.title.toLowerCase().replace(/\W/g, '') });
            const layer = action.layer || getUpdatedLayer(state);
            const format = 'css';
            const metadata = {
                title: action.title,
                description: '',
                msStyleJSON: null,
                msEditorType: 'visual',
                gnLayerName: layer.name,
                gnDatasetPk: layer?.extendedParams?.mapLayer?.dataset?.pk
            };
            const geometryType = geometryTypeSelector(state);
            return Observable.defer(
                () => StylesAPI.createStyle({
                    baseUrl: styleService?.baseUrl,
                    code: getBaseCSSStyle({ type: geometryType, title: action.title }),
                    format,
                    styleName,
                    metadata
                })
            )
                .switchMap(() => {
                    return Observable.of(
                        updateNode(layer.id, 'layer', { availableStyles: [...layer.availableStyles, { format, metadata, name: styleName, title: action.title }] }),
                        updateAdditionalLayer(layer.id, STYLE_OWNER_NAME, 'override', {}),
                        updateSettingsParams({ style: styleName }, true),
                        updateStatus('edit'),
                        saveDirectContent()
                    );
                });
        });

export const gnDeleteStyle = (action$, store) =>
    action$.ofType(DELETE_GEONODE_STYLE)
        .switchMap((action) => {
            const state = store.getState();
            const styleService = action?.options?.styleService || styleServiceSelector(state);
            const layer = action.layer || getUpdatedLayer(state);

            const completeDeleteProcess = () => {
                const newAvailableStyles = (layer.availableStyles || []).filter(({ name }) => name !== action.styleName);
                return Observable.of(
                    updateNode(layer.id, 'layer', { availableStyles: newAvailableStyles }),
                    updateAdditionalLayer(layer.id, STYLE_OWNER_NAME, 'override', {}),
                    updateSettingsParams({ style: newAvailableStyles?.[0]?.name || '' }, true),
                    updateStatus('edit'),
                    saveDirectContent()
                );
            };

            return Observable.defer(() =>
                Observable.defer(() =>
                    StylesAPI.deleteStyle({
                        baseUrl: styleService?.baseUrl,
                        styleName: action.styleName
                    })
                ))
                .switchMap(() => {
                    return completeDeleteProcess();
                })
                .catch(() => {
                    return completeDeleteProcess();
                });
        });

export const gnUpdateStyleInfoOnSave = (action$, store) =>
    action$.ofType(UPDATE_STYLE_CODE)
        .switchMap(() => {
            const state = store.getState();
            const updatedLayer = getUpdatedLayer(state);
            return Observable.of(updateNode(updatedLayer.id, 'layers', { style: updatedLayer.style }));
        });

export default {
    gnCreateStyle,
    gnDeleteStyle,
    gnRequestDatasetAvailableStyles,
    gnUpdateStyleInfoOnSave
};
