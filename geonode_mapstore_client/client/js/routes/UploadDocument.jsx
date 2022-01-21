/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';
import omit from 'lodash/omit';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Dropzone from 'react-dropzone';
import ViewerLayout from '@js/components/ViewerLayout';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Spinner from '@js/components/Spinner';
import { uploadDocument } from '@js/api/geonode/v2';
import uuidv1 from 'uuid/v1';
import axios from '@mapstore/framework/libs/ajax';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { FormControl as FormControlRB } from 'react-bootstrap';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
const FormControl = localizedProps('placeholder')(FormControlRB);
import PendingUploadCard from '@js/routes/upload/PendingUploadCard';
import UploadCard from '@js/routes/upload/UploadCard';

function InputControl({ onChange, value, ...props }) {
    return <FormControl {...props} value={value} onChange={event => onChange(event.target.value)}/>;
}
const InputControlWithDebounce = InputControl;


function getAllowedDocumentTypes() {
    const { allowedDocumentTypes } = getConfigProp('geoNodeSettings') || [];
    return allowedDocumentTypes;
}

function getFileNameParts(file) {
    const { name } = file;
    const nameParts = name.split('.');
    const ext = nameParts[nameParts.length - 1];
    const baseName = [...nameParts].splice(0, nameParts.length - 1).join('.');
    return { ext, baseName };
}

function UploadList({
    children,
    onChange
}) {

    const [waitingUploads, setWaitingUploads] = useState({});
    const [loading, setLoading] = useState(false);


    function updateWaitingUploads(uploadFiles) {
        setWaitingUploads(uploadFiles);
    }

    function handleDrop(files) {
        const checkedFiles = files.map((file) => {
            const { ext } = getFileNameParts(file);
            return {
                supported: !!(getAllowedDocumentTypes().includes(ext)),
                file
            };
        });
        const uploadsGroupedByName = checkedFiles
            .filter(({ supported }) => supported)
            .reduce((acc, { file }) => {
                const { ext, baseName } = getFileNameParts(file);
                return {
                    ...acc,
                    [baseName]: {
                        files: {
                            [ext]: file
                        }
                    }
                };
            }, {});

        const newWaitingUploads = { ...waitingUploads, ...uploadsGroupedByName };
        updateWaitingUploads(newWaitingUploads);
    }

    const inputFile = useRef();

    function handleUploadProcess() {
        if (!loading) {
            setLoading(true);
            axios.all(Object.keys(waitingUploads).map((baseName) => {
                const readyUpload = waitingUploads[baseName];
                const fileExt = Object.keys(readyUpload.files);
                const file = readyUpload.files[fileExt[0]];
                return uploadDocument({
                    title: file?.name,
                    file
                })
                    .then((data) => ({ status: 'SUCCESS', data, file, baseName }))
                    .catch(({ data: error }) => ({ status: 'INVALID', error, file, baseName }));
            }))
                .then((responses) => {
                    const successfulUploads = responses.filter(({ status }) => status === 'SUCCESS');
                    if (successfulUploads.length > 0) {
                        const successfulUploadsNames = successfulUploads.map(({ baseName }) => baseName);
                        updateWaitingUploads(omit(waitingUploads, successfulUploadsNames));
                    }
                    onChange(responses.map(({ status, file, data }) => ({
                        id: uuidv1(),
                        name: file?.name,
                        progress: 100,
                        state: status,
                        detail_url: data?.url,
                        create_date: Date.now()
                    })));
                    setLoading(false);
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
                                Supported files: {getAllowedDocumentTypes().map((ext) => `.${ext}`).join(', ')}
                            </div>
                        )}
                        <div className="gn-upload-list-footer">
                            <Button
                                variant="success"
                                disabled={Object.keys(waitingUploads).length === 0}
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
    uploads: pendingUploads
}) {

    const [filterText, setFilterText] = useState('');

    const filteredPendingUploads = pendingUploads.filter(({ name }) => !filterText || name.includes(filterText));

    return (
        <div className="gn-upload-processing">
            {pendingUploads.length === 0
                ? (
                    <div className="gn-main-event-container">
                        <div className="gn-main-event-content">
                            <div className="gn-main-event-text">
                                <div className="gn-main-icon">
                                    <FaIcon name="file"/>
                                </div>
                                <h1>Document Upload</h1>
                                <div>drag and drop a file</div>
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
                                            resume_url: resumeUrl
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

function UploadDataset({}) {

    const [pendingUploads, setPendingUploads] = useState([]);

    function parseUploadResponse(response) {
        return uniqBy([...response], 'id');
    }

    return (
        <UploadList
            onChange={(successfulUploads) => setPendingUploads(parseUploadResponse([...successfulUploads, ...pendingUploads]))}
        >
            <ProcessingUploadList
                uploads={pendingUploads}
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
