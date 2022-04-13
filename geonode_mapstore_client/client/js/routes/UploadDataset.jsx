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
import pick from 'lodash/pick';
import merge from 'lodash/merge';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import {
    getPendingUploads,
    getProcessedUploadsById,
    getProcessedUploadsByImportId,
    uploadDataset
} from '@js/api/geonode/v2';
import uuidv1 from 'uuid/v1';
import axios from '@mapstore/framework/libs/ajax';
import UploadListContainer from '@js/routes/upload/UploadListContainer';
import UploadContainer from '@js/routes/upload/UploadContainer';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { parseUploadResponse, processUploadResponse } from '@js/utils/ResourceUtils';

const supportedDatasetTypes = [
    {
        id: 'shp',
        label: 'ESRI Shapefile',
        format: 'vector',
        ext: ['shp'],
        requires: ['shp', 'prj', 'dbf', 'shx']
    },
    {
        id: 'tiff',
        label: 'GeoTIFF',
        format: 'raster',
        ext: ['tiff', 'tif'],
        mimeType: ['image/tiff']
    },
    {
        id: 'csv',
        label: 'Comma Separated Value (CSV)',
        format: 'vector',
        ext: ['csv'],
        mimeType: ['text/csv']
    },
    {
        id: 'geojson',
        label: 'GeoJSON',
        format: 'vector',
        ext: ['geojson']
    },
    {
        id: 'zip',
        label: 'Zip Archive',
        format: 'archive',
        ext: ['zip'],
        mimeType: ['application/zip']
    }
];


const supportedExtensions = supportedDatasetTypes.map(({ ext }) => ext || []).flat();
const supportedMimeTypes = supportedDatasetTypes.map(({ mimeType }) => mimeType || []).flat();
const supportedRequiresExtensions = supportedDatasetTypes.map(({ requires }) => requires || []).flat();
const supportedLabels = supportedDatasetTypes.map(({ label }) => label ).join(', ');

function getFileNameParts(file) {
    const { name } = file;
    const nameParts = name.split('.');
    const ext = nameParts[nameParts.length - 1];
    const baseName = [...nameParts].splice(0, nameParts.length - 1).join('.');
    return { ext, baseName };
}

function getDatasetFileType(file) {
    const { type } = file;
    const { ext } = getFileNameParts(file);
    const datasetFileType = supportedDatasetTypes.find((fileType) =>
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

    const [waitingUploads, setWaitingUploads] = useState({});
    const [readyUploads, setReadyUploads] = useState({});
    const [unsupported, setUnsupported] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadContainerProgress, setUploadContainerProgress] = useState({});

    function parseUploadFiles(uploadFiles) {
        return Object.keys(uploadFiles)
            .reduce((acc, baseName) => {
                const uploadFile = uploadFiles[baseName];
                const { requires = [], ext = []} = supportedDatasetTypes.find(({ id }) => id === uploadFile.type) || {};
                const cleanedFiles = pick(uploadFiles[baseName].files, [...requires, ...ext]);
                const filesKeys = Object.keys(cleanedFiles);
                const files = requires.length > 0
                    ? cleanedFiles
                    : filesKeys.length > 1
                        ? pick(cleanedFiles, ext[0])
                        : cleanedFiles;
                const missingExt = requires.filter((fileExt) => !filesKeys.includes(fileExt));
                return {
                    ...acc,
                    [baseName]: {
                        ...uploadFile,
                        mainExt: filesKeys.find(key => ext.includes(key)),
                        files,
                        missingExt
                    }
                };
            }, {});
    }

    function updateWaitingUploads(uploadFiles) {
        const newWaitingUploads = parseUploadFiles(uploadFiles);
        setWaitingUploads(newWaitingUploads);
        const newReadyUploads = Object.keys(newWaitingUploads)
            .reduce((acc, baseName) => {
                if (newWaitingUploads[baseName]?.missingExt?.length > 0) {
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
                supported: !!(supportedMimeTypes.includes(type) || supportedExtensions.includes(ext) || supportedRequiresExtensions.includes(ext)),
                file
            };
        });
        const unsupportedFiles = checkedFiles.filter(({ supported }) => !supported);
        const uploadsGroupedByName = checkedFiles
            .filter(({ supported }) => supported)
            .reduce((acc, { file }) => {
                const { ext, baseName } = getFileNameParts(file);
                const type = getDatasetFileType(file);
                return {
                    ...acc,
                    [baseName]: {
                        type,
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

    const datasetUploadProgress = (fileName) => (progress) => {
        const percentCompleted = Math.floor((progress.loaded * 100) / progress.total);
        setUploadContainerProgress((prevFiles) => ({ ...prevFiles, [fileName]: percentCompleted }));
    };

    function handleUploadProcess() {
        if (!loading) {
            setLoading(true);
            setUnsupported([]);
            axios.all(Object.keys(readyUploads).map((baseName) => {
                const readyUpload = readyUploads[baseName];
                cancelTokens[baseName] = axios.CancelToken;
                sources[baseName] = cancelTokens[baseName].source();
                return uploadDataset({
                    file: readyUpload.files[readyUpload.mainExt],
                    ext: readyUpload.mainExt,
                    auxiliaryFiles: readyUpload.files,
                    config: {
                        onUploadProgress: datasetUploadProgress(baseName),
                        cancelToken: sources[baseName].token
                    }
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
                    if (successfulUploads.length > 0) {
                        const successfulUploadsIds = successfulUploads.map(({ data }) => data?.id);
                        const successfulUploadsNames = successfulUploads.map(({ baseName }) => baseName);
                        updateWaitingUploads(omit(waitingUploads, successfulUploadsNames));
                        getProcessedUploadsByImportId(successfulUploadsIds)
                            .then((successfulUploadProcesses) => {
                                onSuccess(successfulUploadProcesses);
                                setLoading(false);
                            })
                            .catch(() => {
                                setLoading(false);
                            });
                    } else {
                        setLoading(false);
                    }
                    if (errorUploads.length > 0) {
                        const failedUploads = errorUploads.map(({ baseName: name, error }) => ({
                            id: uuidv1(),
                            name,
                            progress: 100,
                            state: 'INVALID',
                            create_date: Date.now(),
                            error
                        }));
                        onSuccess(failedUploads);
                    }
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

    const { maxParallelUploads } = getConfigProp('geoNodeSettings');

    return (
        <UploadContainer
            waitingUploads={waitingUploads}
            onDrop={handleDrop}
            supportedLabels={supportedLabels}
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
            getPendingUploads()
                .then((newPendingUploads) => {
                    if (isMounted.current) {
                        const failedPendingUploads = pendingUploads.filter(({ state }) => state === 'INVALID');
                        const newIds = newPendingUploads.map(({ id }) => id);
                        const missingIds = pendingUploads
                            .filter(upload => (upload.state !== 'PROCESSED' && upload.state !== 'INVALID') && !newIds.includes(upload.id) && !deletedIds.includes(upload.id))
                            .map(({ id }) => id);
                        const currentProcessed = pendingUploads.filter((upload) => upload.state === 'PROCESSED');
                        if (missingIds.length > 0) {
                            getProcessedUploadsById(missingIds)
                                .then((processed) => {
                                    onChange([
                                        ...failedPendingUploads,
                                        ...processed,
                                        ...currentProcessed,
                                        ...newPendingUploads
                                    ]);
                                    setLoading(false);
                                })
                                .catch(() => {
                                    onChange([
                                        ...failedPendingUploads,
                                        ...currentProcessed,
                                        ...newPendingUploads
                                    ]);
                                    setLoading(false);
                                });
                        } else {
                            onChange([
                                ...failedPendingUploads,
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

    function handleDelete({ id, deleteUrl }) {
        axios.get(deleteUrl)
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
