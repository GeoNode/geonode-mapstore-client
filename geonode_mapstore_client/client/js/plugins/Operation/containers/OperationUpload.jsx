/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import Button from '@mapstore/framework/components/layout/Button';
import { Glyphicon } from 'react-bootstrap';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import UploadPanel from '../components/UploadPanel';
import ExecutionRequestTable from '../components/ExecutionRequestTable';
import useUpload from '../hooks/useUpload';
import useExecutionRequest from '../hooks/useExecutionRequest';

function OperationUpload({
    api,
    blocking,
    onSelect,
    onReload,
    iconName = 'file',
    titleMsgId = "gnviewer.uploadFile",
    descriptionMsgId = 'gnviewer.dragAndDropFile',
    refreshTime = 3000,
    pageReload
}) {
    const [forceRequests, setForceRequests] = useState(0);
    const [loadingRequests, setLoadingRequests] = useState(false);

    const {
        requests,
        uploadsToRequest,
        deleteRequest
    } = useExecutionRequest({
        api: api.executionRequest,
        forceRequests,
        refreshTime,
        onRefresh: (_requests) => {
            if (blocking) {
                setLoadingRequests(_requests.some((request) => request.status === 'running'));
            }
        }
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
            if (blocking) {
                setLoadingRequests(true);
            }
        }
    });

    function handleReload() {
        requests.forEach((request) => {
            deleteRequest(request.exec_id);
        });
        onReload(forceRequests === 0, pageReload);
        onSelect(undefined);
    }
    function handleClose() {
        onSelect(undefined);
    }
    const loading = uploadLoading || loadingRequests;
    return (
        <div className="gn-operation">
            <UploadPanel
                supportedFiles={api.upload.supportedFiles}
                enableRemoteUploads={api.upload.enableRemoteUploads}
                maxParallelUploads={api.upload.maxParallelUploads}
                progress={progress}
                loading={uploadLoading}
                errors={errors}
                completed={completed}
                disabled={loadingRequests}
                rightColumn={<div>
                    {blocking ? <Button
                        disabled={loading}
                        className="square-button"
                        onClick={handleReload}
                    >
                        {loading ? <Spinner /> : <Glyphicon glyph="1-close" />}
                    </Button> : <Button
                        className="square-button"
                        onClick={handleClose}
                    >
                        <Glyphicon glyph="1-close" />
                    </Button>}
                </div>}
                onCancel={cancelRequest}
                onUpload={uploadRequest}
            >
                <ExecutionRequestTable
                    iconName={iconName}
                    titleMsgId={titleMsgId}
                    descriptionMsgId={descriptionMsgId}
                    requests={requests}
                    onDelete={deleteRequest}
                    onReload={!loadingRequests && blocking ? handleReload : undefined}
                />
            </UploadPanel>
        </div>
    );
}

export default OperationUpload;
