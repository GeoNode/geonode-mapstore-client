/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';
import omit from 'lodash/omit';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { uploadDocument } from '@js/api/geonode/v2';
import uuidv1 from 'uuid/v1';
import axios from '@mapstore/framework/libs/ajax';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import UploadListContainer from '@js/routes/upload/UploadListContainer';
import UploadContainer from '@js/routes/upload/UploadContainer';

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
    const [unsupported, setUnsupported] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadContainerProgress, setUploadContainerProgress] = useState({});

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
        const unsupportedFiles = checkedFiles.filter(({ supported }) => !supported);
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
        setUnsupported(unsupportedFiles);
    }

    const documentUploadProgress = (fileName) => (progress) => {
        const percentCompleted = Math.floor((progress.loaded * 100) / progress.total);
        setUploadContainerProgress((prevFiles) => ({ ...prevFiles, [fileName]: percentCompleted }));
    };

    const removeFile = (waiting, name) => {
        const uploadFiles = omit(waiting, name);
        updateWaitingUploads(uploadFiles);
    };

    function handleUploadProcess() {
        if (!loading) {
            setLoading(true);
            setUnsupported([]);
            axios.all(Object.keys(waitingUploads).map((baseName) => {
                const readyUpload = waitingUploads[baseName];
                const fileExt = Object.keys(readyUpload.files);
                const file = readyUpload.files[fileExt[0]];
                return uploadDocument({
                    title: file?.name,
                    file,
                    config: {
                        onUploadProgress: documentUploadProgress(baseName)
                    }
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
                    onChange(responses.map(({ status, file, data, error }) => ({
                        id: uuidv1(),
                        name: file?.name,
                        progress: 100,
                        state: status,
                        detail_url: data?.url,
                        create_date: Date.now(),
                        error
                    })));
                    setLoading(false);
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
            supportedLabels={getAllowedDocumentTypes().map((ext) => `.${ext}`).join(', ')}
            onRemove={(baseName) => removeFile(waitingUploads, baseName)}
            unsupported={unsupported}
            disabledUpload={Object.keys(waitingUploads).length === 0}
            onUpload={handleUploadProcess}
            loading={loading}
            progress={uploadContainerProgress}
            type="document"
        >
            {children}
        </UploadContainer>
    );
}

function ProcessingUploadList({
    uploads: pendingUploads
}) {

    const [filterText, setFilterText] = useState('');

    return (
        <UploadListContainer
            filterText={filterText}
            onFilter={setFilterText}
            pendingUploads={pendingUploads}
            placeholderMsgId="gnviewer.filterPendingUploadDocument"
            noFilterMatchMsgId="gnviewer.filterNoMatchUploadDocument"
            titleMsgId="gnviewer.uploadDocument"
            descriptionMsgId="gnviewer.dragAndDropFile"
            resourceType="document"
        />
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
