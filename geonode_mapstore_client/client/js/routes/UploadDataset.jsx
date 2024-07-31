/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import merge from 'lodash/merge';
import uniqBy from 'lodash/uniqBy';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import {
    getProcessedUploadsById,
    getProcessedUploadsByImportId,
    uploadDataset,
    getPendingExecutionRequests,
    deleteExecutionRequest
} from '@js/api/geonode/v2';
import axios from '@mapstore/framework/libs/ajax';
import UploadListContainer from '@js/routes/upload/UploadListContainer';
import UploadContainer from '@js/routes/upload/UploadContainer';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { parseUploadResponse, processUploadResponse, parseUploadFiles } from '@js/utils/ResourceUtils';
import { getFileNameParts, getFileType } from '@js/utils/FileUtils';

function getDatasetFileType(file, supportedTypes) {
    const type = getFileType(file);
    const { ext } = getFileNameParts(file);
    const datasetFileType = supportedTypes.find((fileType) =>
        (fileType.ext || []).includes(ext)
        || (fileType.mimeType || []).includes(type)
        || (fileType.requires || []).includes(ext)
    );
    return datasetFileType?.id;
}

const cancelTokens = {};
const sources = {};

function UploadList({
    children,
    onSuccess
}) {
    const { maxParallelUploads, upload: uploadSettings = {} } = getConfigProp('geoNodeSettings') || {};

    const { supportedDatasetFileTypes: supportedDatasetTypes } = uploadSettings;

    const supportedExtensions = supportedDatasetTypes.map(({ ext }) => ext || []).flat();
    const supportedMimeTypes = supportedDatasetTypes.map(({ mimeType }) => mimeType || []).flat();
    const supportedRequiresExtensions = supportedDatasetTypes.map(({ requires }) => requires || []).flat();
    const supportedLabels = supportedDatasetTypes.map(({ label }) => label).join(', ');
    const supportedOptionalExtensions = supportedDatasetTypes.map(({ optional }) => optional || []).flat();

    const [waitingUploads, setWaitingUploads] = useState({});
    const [readyUploads, setReadyUploads] = useState({});
    const [unsupported, setUnsupported] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadContainerProgress, setUploadContainerProgress] = useState({});
    const [remoteResourceUploads, setRemoteResourceUploads] = useState([]);

    function updateWaitingUploads(uploadFiles) {
        // prepare params for parseUploadFiles
        const params = { uploadFiles, supportedDatasetTypes, supportedOptionalExtensions, supportedRequiresExtensions };
        const newWaitingUploads = parseUploadFiles(params);
        setWaitingUploads(newWaitingUploads);
        const newReadyUploads = Object.keys(newWaitingUploads)
            .reduce((acc, baseName) => {
                if (newWaitingUploads[baseName]?.missingExt?.length > 0 || newWaitingUploads[baseName]?.addMissingFiles) {
                    return acc;
                }
                return {
                    ...acc,
                    [baseName]: newWaitingUploads[baseName]
                };
            }, {});
        setReadyUploads(newReadyUploads);
    }

    function handleDrop(files) {
        const checkedFiles = files.map((file) => {
            const { type } = file;
            const { ext } = getFileNameParts(file);
            return {
                supported: !!(supportedMimeTypes.includes(type) || supportedExtensions.includes(ext) || supportedRequiresExtensions.includes(ext) || supportedOptionalExtensions.includes(ext)),
                file
            };
        });
        const unsupportedFiles = checkedFiles.filter(({ supported }) => !supported);
        const uploadsGroupedByName = checkedFiles
            .filter(({ supported }) => supported)
            .reduce((acc, { file }) => {
                const { ext, baseName } = getFileNameParts(file);
                let type = getDatasetFileType(file, supportedDatasetTypes);
                if (!type && supportedOptionalExtensions.includes(ext)) {
                    type = checkedFiles.length > 1 ? acc[baseName]?.type : ext;
                }
                return {
                    ...acc,
                    [baseName]: {
                        type: type,
                        files: {
                            ...acc[baseName]?.files,
                            [ext]: file
                        }
                    }
                };
            }, {});

        const newWaitingUploads = { ...merge(waitingUploads, uploadsGroupedByName) };
        updateWaitingUploads(newWaitingUploads);
        setUnsupported(unsupportedFiles);
    }

    function handleSetRemoteResourceUploads(newRemoteResourceUploads) {
        setRemoteResourceUploads(newRemoteResourceUploads);
        const newWaitingRemoteResourceUploads = newRemoteResourceUploads
            .filter(({ supported }) => supported)
            .reduce((acc, entry) => {
                const { baseName, remoteUrl, serviceType } = entry;
                return {
                    ...acc,
                    [baseName]: {
                        serviceType,
                        baseName,
                        remoteUrl,
                        remote: true
                    }
                };
            }, {});
        updateWaitingUploads({
            ...Object.keys(waitingUploads)
                .reduce((acc, key) => waitingUploads[key]?.remote
                    ? acc
                    : { ...acc, [key]: waitingUploads[key] }, {}),
            ...newWaitingRemoteResourceUploads
        });
        setUnsupported([
            ...unsupported.filter(({ remote } = {})=> !remote),
            ...uniqBy(newRemoteResourceUploads.filter(({ supported } = {}) => !supported), 'remoteUrl')
                .map(({ remoteUrl } = {}) => ({ url: { name: remoteUrl }, remote: true }))
        ]);
    }

    const datasetUploadProgress = (fileName) => (progress) => {
        const percentCompleted = Math.floor((progress.loaded * 100) / progress.total);
        setUploadContainerProgress((prevFiles) => ({ ...prevFiles, [fileName]: percentCompleted }));
    };

    function getValidFileExt({ files }) {
        const validFile = Object.keys(files).find(key => key !== 'sld' && key !== 'xml');

        return validFile;
    }

    function getUploadRequestPayload({ readyUpload }) {
        if (readyUpload.remote) {
            return {
                url: readyUpload.remoteUrl,
                title: readyUpload.remoteUrl,
                type: readyUpload.serviceType
            };
        }
        const mainExt = (readyUpload.mainExt !== 'sld' && readyUpload.mainExt !== 'xml') ? readyUpload.mainExt : getValidFileExt(readyUpload);
        return {
            file: readyUpload.files[mainExt],
            ext: mainExt,
            auxiliaryFiles: readyUpload.files
        };
    }

    function handleUploadProcess() {
        if (!loading) {
            setLoading(true);
            setUnsupported([]);
            axios.all(Object.keys(readyUploads).map((baseName) => {
                const readyUpload = readyUploads[baseName];
                cancelTokens[baseName] = axios.CancelToken;
                sources[baseName] = cancelTokens[baseName].source();
                const config = {
                    onUploadProgress: datasetUploadProgress(baseName),
                    cancelToken: sources[baseName].token
                };
                const payload = getUploadRequestPayload({ readyUpload, baseName });
                return uploadDataset({
                    ...payload,
                    config
                })
                    .then((data) => ({ status: 'success', data, baseName }))
                    .catch((error) => {
                        if (axios.isCancel(error)) {
                            return { status: 'error', error: 'CANCELED', baseName };
                        }
                        const { data } = error;
                        return { status: 'error', error: data, baseName };
                    });
            }))
                .then((responses) => {
                    const successfulUploads = responses.filter(({ status }) => status === 'success');
                    const errorUploads = responses.filter(({ status }) => status === 'error');
                    if (errorUploads.length > 0) {
                        updateWaitingUploads(Object.keys(waitingUploads).reduce((acc, baseName) => {
                            const error = !!errorUploads.find(errorUpload => errorUpload.baseName === baseName);
                            const waitingUpload = waitingUploads[baseName];
                            return {
                                ...acc,
                                [baseName]: error ? { ...waitingUpload, error: true } : waitingUpload
                            };
                        }, {}));
                    }
                    if (successfulUploads.length > 0) {
                        const successfulUploadsIds = successfulUploads.filter(({ data }) => !!data?.id).map(({data}) => data?.id);
                        const successfulUploadsNames = successfulUploads.map(({ baseName }) => baseName);
                        updateWaitingUploads(omit(waitingUploads, successfulUploadsNames));
                        setRemoteResourceUploads(remoteResourceUploads.filter(({ baseName } = {}) => !successfulUploadsNames.includes(baseName)));
                        successfulUploadsIds.length > 0 && getProcessedUploadsByImportId(successfulUploadsIds)
                            .then((successfulUploadProcesses) => {
                                onSuccess(successfulUploadProcesses);
                            })
                            .catch(() => {
                                setLoading(false);
                            });
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
    }


    const handleCancelSingleUpload = useCallback((baseName) => {
        setUploadContainerProgress((prevFiles) => ({ ...prevFiles, [baseName]: undefined }));
        return sources[baseName].cancel();
    }, []);

    const handleCancelAllUploads = useCallback((files) => {
        return files.forEach((file) => sources[file].cancel());
    }, []);

    return (
        <UploadContainer
            waitingUploads={waitingUploads}
            onDrop={handleDrop}
            supportedLabels={supportedLabels}
            getDefaultRemoteResource={(value) => ({
                ...value,
                // now 3d tiles is the only supported service type
                // we could remove this as soon we have new types
                serviceType: '3dtiles'
            })}
            serviceTypes={[
                { value: '3dtiles', label: '3D Tiles' }
            ]}
            onRemove={(baseName) => updateWaitingUploads(omit(waitingUploads, baseName))}
            unsupported={unsupported}
            disabledUpload={Object.keys(readyUploads).length === 0}
            disableOnParallelLmit={Object.keys(readyUploads).length > maxParallelUploads}
            onUpload={handleUploadProcess}
            loading={loading}
            progress={uploadContainerProgress}
            type="dataset"
            abort={handleCancelSingleUpload}
            abortAll={handleCancelAllUploads}
            remoteResourceUploads={remoteResourceUploads}
            setRemoteResourceUploads={handleSetRemoteResourceUploads}
        >
            {children}
        </UploadContainer>
    );
}

function ProcessingUploadList({
    uploads: pendingUploads,
    onChange,
    refreshTime = 3000,
    onDelete
}) {

    const [loading, setLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [deletedIds, setDeletedIds] = useState([]);

    const isMounted = useRef(true);
    const updatePending = useRef();
    updatePending.current = () => {
        if (!loading) {
            setLoading(true);
            getPendingExecutionRequests()
                .then((newPendingUploads) => {
                    if (isMounted.current) {
                        const failedPendingUploads = pendingUploads.filter(({ state }) => state === 'INVALID');
                        const newIds = newPendingUploads.map(({ id }) => id);
                        const pendingImports = newPendingUploads.filter(({ action, exec_id: execitionId }) => !!action && action === 'import' && !deletedIds.includes(execitionId)).map(pendingImport => ({ ...pendingImport, create_date: pendingImport.created, id: pendingImport.exec_id }));
                        const missingIds = pendingUploads
                            .filter(upload => (!!upload.state && upload.state !== 'PROCESSED' && upload.state !== 'INVALID') && !newIds.includes(upload.id) && !deletedIds.includes(upload.id))
                            .map(({ id }) => id);
                        const currentProcessed = pendingUploads.filter((upload) => upload.state === 'PROCESSED');
                        if (missingIds.length > 0) {
                            getProcessedUploadsById(missingIds)
                                .then((processed) => {
                                    onChange([
                                        ...failedPendingUploads,
                                        ...pendingImports,
                                        ...processed,
                                        ...currentProcessed,
                                        ...newPendingUploads
                                    ]);
                                    setLoading(false);
                                })
                                .catch(() => {
                                    onChange([
                                        ...failedPendingUploads,
                                        ...pendingImports,
                                        ...currentProcessed,
                                        ...newPendingUploads
                                    ]);
                                    setLoading(false);
                                });
                        } else {
                            onChange([
                                ...failedPendingUploads,
                                ...pendingImports,
                                ...currentProcessed,
                                ...newPendingUploads
                            ]);
                            setLoading(false);
                        }
                    }
                })
                .catch(() => {
                    if (isMounted.current) {
                        setLoading(false);
                    }
                });
        }
    };

    function handleDelete({ id, deleteUrl = null }) {
        const deleteRequest = deleteUrl ? () => axios.get(deleteUrl) : () => deleteExecutionRequest(id);
        deleteRequest()
            .finally(() => {
                if (isMounted.current) {
                    setDeletedIds((ids) => [...ids, id]);
                    onDelete(pendingUploads.filter(upload => upload.id !== id));
                }
            });
    }

    useEffect(() => {
        isMounted.current = true;
        updatePending.current();
        const interval = setInterval(() => {
            updatePending.current();
        }, refreshTime);
        return () => {
            clearInterval(interval);
            isMounted.current = false;
        };
    }, []);

    return (
        <UploadListContainer
            filterText={filterText}
            onFilter={setFilterText}
            pendingUploads={pendingUploads}
            onDelete={handleDelete}
            placeholderMsgId="gnviewer.filterPendingUploadDataset"
            noFilterMatchMsgId="gnviewer.filterNoMatchUploadDataset"
            titleMsgId="gnviewer.uploadDataset"
            descriptionMsgId="gnviewer.dragAndDropFile"
        />
    );
}

function UploadDataset({
    refreshTime = 3000
}) {

    const [pendingUploads, setPendingUploads] = useState([]);

    return (
        <UploadList
            onSuccess={(successfulUploads) => setPendingUploads((prevUploads) => parseUploadResponse([...successfulUploads, ...prevUploads]))}
        >
            <ProcessingUploadList
                uploads={pendingUploads}
                onChange={(uploads) => setPendingUploads((prevUploads) => processUploadResponse([...prevUploads, ...uploads]))}
                onDelete={(uploads) => setPendingUploads(parseUploadResponse(uploads))}
                refreshTime={refreshTime}
            />
        </UploadList>
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
