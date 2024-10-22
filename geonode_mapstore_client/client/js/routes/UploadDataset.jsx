/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import UploadPanel from '@js/plugins/Operation/components/UploadPanel';
import ExecutionRequestTable from '@js/plugins/Operation/components/ExecutionRequestTable';
import useUpload from '@js/plugins/Operation/hooks/useUpload';
import useExecutionRequest from '@js/plugins/Operation/hooks/useExecutionRequest';
import {
    getUploadMainFile,
    getUploadProperty,
    getSupportedFilesByResourceType,
    getMaxParallelUploads,
    getMaxAllowedSizeByResourceType
} from '@js/utils/UploadUtils';
import {
    getEndpointUrl,
    UPLOADS,
    EXECUTION_REQUEST
} from '@js/api/geonode/v2/constants';

function UploadDataset({
    refreshTime = 3000
}) {

    const api = {
        upload: {
            url: getEndpointUrl(UPLOADS, '/upload'),
            body: {
                file: {
                    'base_file': getUploadMainFile,
                    'store_spatial_files': true,
                    'action': 'upload'
                },
                remote: {
                    'url': getUploadProperty('url'),
                    'title': getUploadProperty('url'),
                    'type': getUploadProperty('remoteType'),
                    'action': 'upload'
                }
            }
        },
        executionRequest: {
            url: getEndpointUrl(EXECUTION_REQUEST),
            params: {
                'filter{action}': 'upload',
                'sort[]': '-created'
            }
        }
    };

    const [forceRequests, setForceRequests] = useState(0);

    const {
        requests,
        uploadsToRequest,
        deleteRequest
    } = useExecutionRequest({
        api: api.executionRequest,
        forceRequests,
        refreshTime,
        onRefresh: () => {}
    });

    const {
        progress,
        loading: uploadLoading,
        errors,
        completed,
        cancelRequest,
        uploadRequest
    } = useUpload({
        api: api.upload,
        onComplete: (responses, successfulUploads) => {
            uploadsToRequest(successfulUploads);
            setForceRequests(prevForceRequests => prevForceRequests + 1);
        }
    });
    return (
        <UploadPanel
            enableRemoteUploads
            supportedFiles={getSupportedFilesByResourceType('dataset', { actions: ['upload'] })}
            maxParallelUploads={getMaxParallelUploads()}
            maxAllowedSize={getMaxAllowedSizeByResourceType('dataset')}
            progress={progress}
            loading={uploadLoading}
            errors={errors}
            completed={completed}
            onCancel={cancelRequest}
            onUpload={uploadRequest}
            getDefaultRemoteResource={(value) => ({
                ...value,
                // now 3d tiles is the only supported service type
                // we could remove this as soon we have new types
                remoteType: '3dtiles'
            })}
            remoteTypes={[
                { value: '3dtiles', label: '3D Tiles' }
            ]}
            remoteTypeErrorMessageId="gnviewer.unsupportedUrlServiceType"
        >
            <ExecutionRequestTable
                iconName="database"
                titleMsgId="gnviewer.uploadDataset"
                descriptionMsgId="gnviewer.dragAndDropFile"
                requests={requests}
                onDelete={deleteRequest}
            />
        </UploadPanel>
    );
}

UploadDataset.propTypes = {
    location: PropTypes.object
};

UploadDataset.defaultProps = {

};

const ConnectedUploadDataset = connect(
    createSelector([], () => ({}))
)(UploadDataset);

export default ConnectedUploadDataset;
