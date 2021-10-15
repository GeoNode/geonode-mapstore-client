/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import { getDatasetByName } from '@js/api/geonode/v2';
import { updateNode } from '@mapstore/framework/actions/layers';
import { updateStatus } from '@mapstore/framework/actions/styleeditor';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { updateAdditionalLayer } from '@mapstore/framework/actions/additionallayers';
import { STYLE_OWNER_NAME } from '@mapstore/framework/utils/StyleEditorUtils';
import StylesAPI from '@mapstore/framework/api/geoserver/Styles';
import { styleServiceSelector } from '@mapstore/framework/selectors/styleeditor';
import {
    CREATE_GEONODE_STYLE,
    DELETE_GEONODE_STYLE,
    REQUEST_DATASET_AVAILABLE_STYLES
} from '@js/actions/visualstyleeditor';

export const gnRequestDatasetAvailableStyles = (action$, store) =>
    action$.ofType(REQUEST_DATASET_AVAILABLE_STYLES)
        .switchMap((action) => {
            if (action?.layer?.availableStyles && !action?.options?.forceUpdate) {
                return Observable.of(
                    setControlProperty('visualStyleEditor', 'enabled', true),
                    updateAdditionalLayer(action.layer.id, STYLE_OWNER_NAME, 'override', {}),
                    updateStatus('edit')
                );
            }
            const state = store.getState();
            const styleService = action?.options?.styleService || styleServiceSelector(state);
            return Observable.concat(
                Observable.of(setControlProperty('visualStyleEditor', 'enabled', true)),
                Observable.defer(() => getDatasetByName(action?.layer?.name))
                    .switchMap((gnLayer) => {
                        return Observable.defer(() => StylesAPI.getStylesInfo({
                            baseUrl: styleService?.baseUrl,
                            styles: (gnLayer?.styles || []).map((style) => ({
                                title: style.sld_title,
                                name: style.workspace ? `${style.workspace}:${style.name}` : style.name
                            }))
                        }))
                            .switchMap((availableStyles) => {
                                return Observable.of(
                                    updateNode(action.layer.id, 'layer', { availableStyles }),
                                    updateAdditionalLayer(action.layer.id, STYLE_OWNER_NAME, 'override', {}),
                                    updateStatus('edit')
                                );
                            });
                    })
            );
        });

export const gnCreateStyle = (action$) =>
    action$.ofType(CREATE_GEONODE_STYLE)
        .switchMap(() => {
            return Observable.empty();
            /*
            const state = store.getState();
            const styleService = action?.options?.styleService || styleServiceSelector(state);

            const editorMetadata = {
                msStyleJSON: null,
                msEditorType: 'visual'
            };

            const metadata = {
                title: action.title,
                description: '',
                ...editorMetadata
            };

            return Observable.defer(
                () => StylesAPI.createStyle({
                    baseUrl: styleService?.baseUrl,
                    code: '@mode \'Flat\'; @styleTitle \'' + action.title + '\'; \n* {\n\tfill: #ff0000;\n}\n',
                    format: 'css',
                    styleName: 'geonode:' + action.title.toLowerCase().replace(/\W/g, '') + '_' + Math.random(),
                    metadata
                })
            )
                .switchMap(() => {
                    return Observable.empty();
                });
                */
        });

export const gnDeleteStyle = (action$) =>
    action$.ofType(DELETE_GEONODE_STYLE)
        .switchMap(() => {
            return Observable.empty();
        });

export default {
    gnCreateStyle,
    gnDeleteStyle,
    gnRequestDatasetAvailableStyles
};
