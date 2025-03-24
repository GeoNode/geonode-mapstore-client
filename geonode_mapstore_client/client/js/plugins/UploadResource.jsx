/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { createPlugin } from "@mapstore/framework/utils/PluginsUtils";
import UploadDataset from "@js/routes/UploadDataset";
import UploadDocument from "@js/routes/UploadDocument";

/**
 * Upload resource plugin
 * @prop {object} cfg.resourceType the type of the resource to upload (dataset or document)
 * @prop {object} cfg.viewResource flag to show view resource button
 * @prop {object} cfg.editMetadata flag to show edit metadata button of the resource
 * @name UploadResource
 * @memberof plugins
 */
const UploadResource = ({ resourceType, ...uploadConfig }) => {
    const Component =  resourceType === "dataset" ? UploadDataset : UploadDocument;
    return (
        <div className="gn-upload-container">
            <Component uploadConfig={uploadConfig}/>
        </div>
    );
};

export default createPlugin('UploadResource', {
    component: UploadResource,
    containers: {},
    epics: {},
    reducers: {}
});
