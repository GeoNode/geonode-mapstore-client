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
    getMaxAllowedSizeByResourceType,
    hasExtensionInUrl
} from '@js/utils/UploadUtils';
import {
    getEndpointUrl,
    UPLOADS,
    EXECUTION_REQUEST
} from '@js/api/geonode/v2/constants';
import { canAddRemoteResource } from '@js/selectors/resource';

function UploadDocument({
    refreshTime,
    uploadConfig,
    enableRemoteUploads = false
}) {

    const api = {
        upload: {
            url: getEndpointUrl(UPLOADS, '/upload'),
            body: {
                file: {
                    'base_file': getUploadMainFile,
                    'action': "document_upload"
                },
                remote: {
                    'url': getUploadProperty('url'),
                    'extension': getUploadProperty('remoteType'),
                    'action': "document_upload"
                }
            }
        },
        executionRequest: {
            url: getEndpointUrl(EXECUTION_REQUEST),
            params: {
                'filter{action}': 'document_upload',
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
        onComplete: (_, successfulUploads) => {
            uploadsToRequest(successfulUploads);
            setForceRequests(prevForceRequests => prevForceRequests + 1);
        }
    });

    const supportedFiles = getSupportedFilesByResourceType('document');
    return (
        <UploadPanel
            enableRemoteUploads={enableRemoteUploads}
            supportedFiles={supportedFiles}
            maxParallelUploads={getMaxParallelUploads()}
            maxAllowedSize={getMaxAllowedSizeByResourceType('document')}
            progress={progress}
            loading={uploadLoading}
            errors={errors}
            completed={completed}
            onCancel={cancelRequest}
            onUpload={uploadRequest}
            remoteTypes={supportedFiles.map(({ required_ext: ext }) => ({ value: `.${ext[0]}`, label: `.${ext[0]}` }))}
            remoteTypeErrorMessageId="gnviewer.unsupportedUrlExtension"
            remoteTypesPlaceholder="ext"
            remoteTypeFromUrl
            isRemoteTypesDisabled={(data) => {
                return !data?.validation?.isValidRemoteUrl || hasExtensionInUrl(data);
            }}
        >
            <ExecutionRequestTable
                iconName="file"
                titleMsgId="gnviewer.uploadDocument"
                descriptionMsgId="gnviewer.dragAndDropFile"
                requests={requests}
                onDelete={deleteRequest}
                {...uploadConfig}
            />
        </UploadPanel>
    );
}

UploadDocument.propTypes = {
    location: PropTypes.object
};

UploadDocument.defaultProps = {
    refreshTime: 3000
};

const ConnectedUploadDocument = connect(
    createSelector([canAddRemoteResource], (enableRemoteUploads) => ({ enableRemoteUploads }))
)(UploadDocument);

export default ConnectedUploadDocument;
