/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {
    getEndpoints,
    getConfiguration,
    getAccountInfo,
    getDocumentByPk
} from '@js/api/geonode/v2';
import {
    setupConfiguration,
    initializeApp
} from '@js/utils/AppUtils';
import MediaViewer from '@js/components/MediaViewer';

initializeApp();

document.addEventListener('DOMContentLoaded', function() {
    getEndpoints().then(() => {
        Promise.all([
            getConfiguration(),
            getAccountInfo()
        ])
            .then(([localConfig, user]) => {
                const {
                    geoNodePageConfig,
                    targetId = 'ms-container'
                } = setupConfiguration({ localConfig, user });

                getDocumentByPk(geoNodePageConfig.resourceId)
                    .then((resource) => {
                        ReactDOM.render(
                            <div className="gn-media-viewer">
                                <MediaViewer resource={resource}/>
                            </div>,
                            document.getElementById(targetId)
                        );
                    });
            });
    });
});
