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

const UploadOperation = ({ resourceType, ...uploadConfig }) => {
    const Component =  resourceType === "dataset" ? UploadDataset : UploadDocument;
    return (
        <div className="gn-upload-container">
            <Component uploadConfig={uploadConfig}/>
        </div>
    );
};

export default createPlugin('UploadOperation', {
    component: UploadOperation,
    containers: {},
    epics: {},
    reducers: {}
});
