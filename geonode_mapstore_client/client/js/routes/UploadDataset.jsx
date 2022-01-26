/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';
import orderBy from 'lodash/orderBy';
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
import axios from '@mapstore/framework/libs/ajax';
import UploadListContainer from '@js/routes/upload/UploadListContainer';
import UploadContainer from '@js/routes/upload/UploadContainer';

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

function UploadList({
    children,
    onSuccess
}) {

    const [waitingUploads, setWaitingUploads] = useState({});
    const [readyUploads, setReadyUploads] = useState({});
    const [unsupported, setUnsupported] = useState([]);
    const [loading, setLoading] = useState(false);

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

    function handleUploadProcess() {
        if (!loading) {
            setLoading(true);
            setUnsupported([]);
            axios.all(Object.keys(readyUploads).map((baseName) => {
                const readyUpload = readyUploads[baseName];
                return uploadDataset({
                    file: readyUpload.files[readyUpload.mainExt],
                    ext: readyUpload.mainExt,
                    auxiliaryFiles: readyUpload.files
                })
                    .then((data) => ({ status: 'success', data, baseName }))
                    .catch(({ data: error }) => ({ status: 'error', error, baseName }));
            }))
                .then((responses) => {
                    const successfulUploads = responses.filter(({ status }) => status === 'success');
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
                })
                .catch(() => {
                    setLoading(false);
                });
        }
    }

    return (
        <UploadContainer
            waitingUploads={waitingUploads}
            onDrop={handleDrop}
            supportedLabels={supportedLabels}
            onRemove={(baseName) => updateWaitingUploads(omit(waitingUploads, baseName))}
            unsupported={unsupported}
            disabledUpload={Object.keys(waitingUploads).length === 0}
            onUpload={handleUploadProcess}
            loading={loading}
        >
            {children}
        </UploadContainer>
    );
}

function ProcessingUploadList({
    uploads: pendingUploads,
    onChange,
    refreshTime = 3000
}) {

    const [loading, setLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const isMounted = useRef(true);
    const updatePending = useRef();
    updatePending.current = () => {
        if (!loading) {
            setLoading(true);
            getPendingUploads()
                .then((newPendingUploads) => {
                    if (isMounted.current) {
                        const newIds = newPendingUploads.map(({ id }) => id);
                        const missingIds = pendingUploads
                            .filter(upload => upload.state !== 'PROCESSED' && !newIds.includes(upload.id))
                            .map(({ id }) => id);
                        const currentProcessed = pendingUploads.filter((upload) => upload.state === 'PROCESSED');
                        if (missingIds.length > 0) {
                            getProcessedUploadsById(missingIds)
                                .then((processed) => {
                                    onChange([
                                        ...processed,
                                        ...currentProcessed,
                                        ...newPendingUploads
                                    ]);
                                    setLoading(false);
                                })
                                .catch(() => {
                                    onChange([
                                        ...currentProcessed,
                                        ...newPendingUploads
                                    ]);
                                    setLoading(false);
                                });
                        } else {
                            onChange([
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
            .then(() => {
                if (isMounted.current) {
                    onChange(pendingUploads.filter(upload => upload.id !== id));
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

    function parseUploadResponse(response) {
        return orderBy(uniqBy([...response], 'id'), 'create_date', 'desc');
    }

    return (
        <UploadList
            onSuccess={(successfulUploads) => setPendingUploads(parseUploadResponse([...successfulUploads, ...pendingUploads]))}
        >
            <ProcessingUploadList
                uploads={pendingUploads}
                onChange={(uploads) => setPendingUploads(parseUploadResponse(uploads))}
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
