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
import {
    getUploadMainFile,
    getUploadProperty,
    getSupportedFilesByResourceType,
    getMaxParallelUploads,
    getMaxAllowedSizeByResourceType,
    hasExtensionInUrl,
    getUploadFileName
} from '@js/utils/UploadUtils';

function UploadDocument({uploadConfig}) {

    const [requests, setRequests] = useState([]);

    const api = {
        upload: {
            url: '/documents/upload?no__redirect=true',
            body: {
                file: {
                    'title': getUploadFileName,
                    'doc_file': getUploadMainFile
                },
                remote: {
                    'title': getUploadFileName,
                    'doc_url': getUploadProperty('url'),
                    'extension': getUploadProperty('remoteType')
                }
            }
        }
    };

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
            setRequests(prevRequests =>[
                ...successfulUploads.map(({ data, upload }) => {
                    return {
                        exec_id: upload.id,
                        name: getUploadFileName({ upload }),
                        created: Date.now(),
                        status: 'finished',
                        output_params: {
                            resources: [
                                {
                                    detail_url: data.url
                                }
                            ]
                        }
                    };
                }),
                ...prevRequests
            ]);
        }
    });

    const supportedFiles = getSupportedFilesByResourceType('document');
    return (
        <UploadPanel
            enableRemoteUploads
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
                onDelete={(deleteId) => {
                    setRequests(prevRequests => prevRequests.filter(request => request.exec_id !== deleteId));
                }}
                {...uploadConfig}
            />
        </UploadPanel>
    );
}

UploadDocument.propTypes = {
    location: PropTypes.object
};

UploadDocument.defaultProps = {

};

const ConnectedUploadDocument = connect(
    createSelector([], () => ({}))
)(UploadDocument);

export default ConnectedUploadDocument;
