/*
 * Copyright 2020, GeoSolutions Sas.
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
import Dropzone from 'react-dropzone';
import ViewerLayout from '@js/components/ViewerLayout';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Spinner from '@js/components/Spinner';
import Badge from '@js/components/Badge';
import {
    getPendingUploads,
    getProcessedUploadsById,
    getProcessedUploadsByImportId,
    uploadDataset
} from '@js/api/geonode/v2';
import axios from '@mapstore/framework/libs/ajax';
import moment from 'moment';
import { FormControl as FormControlRB } from 'react-bootstrap';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
// import withDebounceOnCallback from '@mapstore/framework/components/misc/enhancers/withDebounceOnCallback';
const FormControl = localizedProps('placeholder')(FormControlRB);

function InputControl({ onChange, value, ...props }) {
    return <FormControl {...props} value={value} onChange={event => onChange(event.target.value)}/>;
}
const InputControlWithDebounce = InputControl;

const supportedDatasetTypes = [
    {
        id: 'shp',
        label: 'ESRI Shapefile',
        format: 'vector',
        ext: ['shp'],
        requires: ['shp', 'prj', 'dbf', 'shx']
    },
    {
        id: 'asc',
        label: 'ASCII Text File',
        format: 'raster',
        ext: ['asc']
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
        label: 'Comma Separated Value',
        format: 'vector',
        ext: ['csv'],
        mimeType: ['text/csv']
    },
    {
        id: 'kml',
        label: 'Google Earth KML',
        format: 'archive',
        ext: ['kml']
    },
    {
        id: 'kmz',
        label: 'Google Earth KMZ',
        format: 'archive',
        ext: ['kmz']
    },
    {
        id: 'geojson',
        label: 'GeoJSON',
        format: 'vector',
        ext: ['json', 'geojson'],
        mimeType: ['application/json', 'application/geo+json']
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

function PendingUploadCard({
    missingExt,
    baseName,
    onRemove,
    filesExt
}) {
    return (
        <div className="gn-upload-card">
            <div className="gn-upload-card-header">
                {missingExt.length > 0 ? <div className="gn-upload-card-error"><FaIcon name="exclamation"/></div> : null}
                <div className="gn-upload-card-title">{baseName}</div>
                {onRemove
                    ? <Button size="xs" onClick={onRemove}>
                        <FaIcon name="trash"/>
                    </Button>
                    : null}
            </div>
            {missingExt.length > 0 && <div className="gn-upload-card-body">
                Missing files: {missingExt.join(', ')}
            </div>}
            {<ul>
                {filesExt.map(ext => {
                    return (
                        <li key={ext}>
                            <Badge>.{ext}</Badge>
                        </li>
                    );
                })}
            </ul>}
        </div>
    );
}

function UploadCard({
    name,
    state,
    detailUrl,
    progress,
    createDate,
    resumeUrl,
    onRemove
}) {
    return (
        <div className="gn-upload-card">
            <div className="gn-upload-card-header">
                {state === 'INVALID' ? <div className="gn-upload-card-error"><FaIcon name="exclamation"/></div> : null}
                <div className="gn-upload-card-title">
                    {detailUrl
                        ? <a
                            href={detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {name}
                        </a>
                        : name}
                </div>
                {(state === 'PENDING' || state === 'COMPLETE') && progress < 100 ? <Spinner /> : null}
                {onRemove
                    ? <Button size="xs" onClick={onRemove}>
                        <FaIcon name="trash"/>
                    </Button>
                    : null}
            </div>
            <div className="gn-upload-card-body">
                <div>{moment(createDate).format('MMMM Do YYYY')}</div>
            </div>
            <div className="gn-upload-card-footer">
                <div className="gn-upload-card-tools">
                    {resumeUrl
                        ? <Button
                            variant="primary"
                            size="xs"
                            href={resumeUrl}
                        >
                            Complete upload
                        </Button>
                        : null}
                </div>
            </div>
            <div
                className={`gn-upload-card-progress ${state && state.toLowerCase() || ''}`}
                style={{
                    width: `100%`,
                    height: 2
                }}
            >
                <div
                    style={{
                        width: `${progress}%`,
                        height: 2,
                        transition: '0.3s all'
                    }}
                >
                </div>
            </div>
        </div>
    );
}

function UploadList({
    children,
    onSuccess
}) {

    const [waitingUploads, setWaitingUploads] = useState({});
    const [readyUploads, setReadyUploads] = useState({});
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
    }

    const inputFile = useRef();

    function handleUploadProcess() {
        if (!loading) {
            setLoading(true);
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

    const waitingUploadNames = Object.keys(waitingUploads);
    return (
        <Dropzone
            multiple
            onDrop={handleDrop}
            className="gn-upload-dataset"
            activeClassName="gn-dropzone-active"
            rejectClassName="gn-dropzone-reject"
            disableClick
        >
            <ViewerLayout
                leftColumn={
                    <div className="gn-upload-list">
                        <div className="gn-upload-list-header">
                            <input ref={inputFile} type="file" multiple onChange={(event) => handleDrop([...event?.target?.files])} style={{ display: 'none' }}/>
                            <Button onClick={() => inputFile?.current?.click()}>
                                <FaIcon name="plus"/>{' '}Select files...
                            </Button>
                        </div>
                        {waitingUploadNames.length > 0 ? (
                            <ul>
                                {waitingUploadNames.map((baseName) => {
                                    const { files, missingExt = [] } = waitingUploads[baseName];
                                    const filesExt = Object.keys(files);
                                    return (
                                        <li
                                            key={baseName}
                                        >
                                            <PendingUploadCard
                                                missingExt={missingExt}
                                                baseName={baseName}
                                                onRemove={() => updateWaitingUploads(omit(waitingUploads, baseName))}
                                                filesExt={filesExt}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    textAlign: 'center'
                                }}
                            >
                                Supported files: {supportedLabels}
                            </div>
                        )}
                        <div className="gn-upload-list-footer">
                            <Button
                                variant="success"
                                disabled={Object.keys(readyUploads).length === 0}
                                onClick={handleUploadProcess}
                            >
                                Upload
                            </Button>
                        </div>
                        {loading && (
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    textAlign: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    fontSize: '3rem'
                                }}
                            >
                                <Spinner />
                            </div>
                        )}
                    </div>
                }
            >
                {children}
            </ViewerLayout>
        </Dropzone>
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

    const filteredPendingUploads = pendingUploads.filter(({ name }) => !filterText || name.includes(filterText));

    return (
        <div className="gn-upload-processing">
            {pendingUploads.length === 0
                ? (
                    <div className="gn-main-event-container">
                        <div className="gn-main-event-content">
                            <div className="gn-main-event-text">
                                <div className="gn-main-icon">
                                    <FaIcon name="database"/>
                                </div>
                                <h1>Dataset Upload</h1>
                                <div>drag and drop a dataset file</div>
                                {/* <Message msgId={msgId} /> */}
                            </div>
                        </div>
                    </div>
                )
                : (
                    <>
                        <div className="gn-upload-processing-header">
                            <InputControlWithDebounce
                                value={filterText}
                                onChange={setFilterText}
                                placeholder="Filter pending uploads by name..."
                            />
                        </div>
                        <div className="gn-upload-processing-list">
                            {filteredPendingUploads.length > 0
                                ? <ul>
                                    {filteredPendingUploads
                                        .map(({
                                            id,
                                            name,
                                            progress = 0,
                                            state,
                                            create_date: createDate,
                                            detail_url: detailUrl,
                                            resume_url: resumeUrl,
                                            delete_url: deleteUrl
                                        }) => {
                                            return (
                                                <li
                                                    key={id}
                                                >
                                                    <UploadCard
                                                        name={name}
                                                        state={state}
                                                        detailUrl={detailUrl}
                                                        progress={progress}
                                                        createDate={createDate}
                                                        resumeUrl={resumeUrl}
                                                        onRemove={deleteUrl ? () => handleDelete({ id, deleteUrl }) : null}
                                                    />
                                                </li>
                                            );
                                        })}
                                </ul>
                                : (
                                    <div className="gn-main-event-container">
                                        <div className="gn-main-event-content">
                                            <div className="gn-main-event-text">
                                                <div className="gn-main-icon">
                                                    <FaIcon name="database"/>
                                                </div>
                                                <div>Filter does not match a pending upload</div>
                                                {/* <Message msgId={msgId} /> */}
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </>
                )}
        </div>
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
