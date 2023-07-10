/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import uniqBy from 'lodash/uniqBy';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import uuidv1 from 'uuid/v1';

import { uploadDocument } from '@js/api/geonode/v2';
import axios from '@mapstore/framework/libs/ajax';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import UploadListContainer from '@js/routes/upload/UploadListContainer';
import UploadContainer from '@js/routes/upload/UploadContainer';
import { getFileNameParts } from '@js/utils/FileUtils';

function getAllowedDocumentTypes() {
    const { allowedDocumentTypes } = getConfigProp('geoNodeSettings') || [];
    return allowedDocumentTypes;
}

const cancelTokens = {};
const sources = {};

function UploadList({
    children,
    onChange
}) {

    const [waitingUploads, setWaitingUploads] = useState({});
    const [unsupported, setUnsupported] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadContainerProgress, setUploadContainerProgress] = useState({});
    const [uploadUrls, setUploadUrls] = useState([]);

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

    const onUnsupportedUrl = (unsupportedUrls) => {
        setUnsupported(unsupported
            ?.filter(({file} = {})=> file)
            ?.concat(
                uniqBy(unsupportedUrls
                    ?.filter(({ supported } = {}) => !isNil(supported) && !supported)
                    ?.map(({docUrl} = {}) => ({url: {name: docUrl}})), 'url.name')
            ));
    };

    const handleAddUrl = (docUrls) => {
        let _uploadUrls = [...uploadUrls];
        const emptyBaseName = 'empty-url';
        if (isEmpty(docUrls)) {
            if (!uploadUrls.some(doc => doc.baseName === emptyBaseName || isEmpty(doc.docUrl))) {
                _uploadUrls = _uploadUrls.concat({
                    docUrl: '',
                    extension: '',
                    baseName: emptyBaseName
                });
                setUploadUrls(_uploadUrls);
            }
        }
        let _waitingUploads = {...waitingUploads};
        const waitingUploadUrls = docUrls
            ?.filter(({ supported }) => supported)
            ?.reduce((acc, documentUrl) => {
                const { extension, baseName, docUrl } = documentUrl;
                return {
                    ...acc,
                    [baseName]: {
                        urls: {
                            [extension]: docUrl
                        }
                    }
                };
            }, {});
        _waitingUploads = {..._waitingUploads, ...waitingUploadUrls};
        updateWaitingUploads(_waitingUploads);
        onUnsupportedUrl((isEmpty(docUrls) ? uploadUrls : docUrls));
    };

    const documentUploadProgress = (fileName) => (progress) => {
        const percentCompleted = Math.floor((progress.loaded * 100) / progress.total);
        setUploadContainerProgress((prevFiles) => ({ ...prevFiles, [fileName]: percentCompleted }));
    };

    const removeFile = (waiting, name) => {
        const uploadFiles = omit(waiting, name);
        updateWaitingUploads(uploadFiles);
    };

    const removeUrl = (onRemove) => {
        onRemove(onUnsupportedUrl);
    };

    const onSuccessfulUpload = (successfulUploads) => {
        const successfulUploadsNames = successfulUploads.map(({ baseName }) => baseName);
        updateWaitingUploads(omit(waitingUploads, successfulUploadsNames));
        setUploadUrls(omit(uploadUrls, successfulUploadsNames));
    };

    function handleUploadProcess() {
        if (!loading) {
            setLoading(true);
            setUnsupported([]);
            axios.all(Object.keys(waitingUploads).map((baseName) => {
                const readyUpload = waitingUploads[baseName];
                cancelTokens[baseName] = axios.CancelToken;
                sources[baseName] = cancelTokens[baseName].source();
                let payload;
                if (readyUpload.files) {
                    const fileExt = Object.keys(readyUpload.files);
                    const file = readyUpload.files[fileExt[0]];
                    payload = {title: file?.name, file};
                } else if (readyUpload.urls) {
                    const [urlExt] = Object.keys(readyUpload.urls);
                    const url = readyUpload.urls[urlExt];
                    payload = {title: baseName, url, extension: urlExt};
                }
                const fileName = payload.title;
                return uploadDocument({
                    ...payload,
                    config: {
                        onUploadProgress: documentUploadProgress(baseName),
                        cancelToken: sources[baseName].token
                    }
                })
                    .then((data) => ({ status: 'SUCCESS', data, fileName, baseName }))
                    .catch((error) => {
                        if (axios.isCancel(error)) {
                            return { status: 'INVALID', error: 'CANCELED', fileName, baseName };
                        }
                        const { data } = error;
                        return { status: 'INVALID', error: data, fileName, baseName };
                    });
            }))
                .then((responses) => {
                    const successfulUploads = responses.filter(({ status }) => status === 'SUCCESS');

                    if (successfulUploads.length > 0) {
                        onSuccessfulUpload(successfulUploads);
                    }
                    onChange(responses.map(({ status, fileName: name, data, error }) => {
                        return {
                            id: uuidv1(),
                            name,
                            progress: 100,
                            state: status,
                            detail_url: data?.url,
                            create_date: Date.now(),
                            error
                        };
                    }));
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

    const { maxParallelUploads } = getConfigProp('geoNodeSettings');

    const isDisableUpload = () => {
        return (
            Object.keys(waitingUploads).length === 0
            || uploadUrls.some(({supported} = {}) => supported === false)
        );
    };
    return (
        <UploadContainer
            waitingUploads={waitingUploads}
            onDrop={handleDrop}
            onAddUrl={handleAddUrl}
            supportedLabels={getAllowedDocumentTypes().map((ext) => `.${ext}`).join(', ')}
            onRemove={(baseName) => removeFile(waitingUploads, baseName)}
            unsupported={unsupported}
            disabledUpload={isDisableUpload()}
            disableOnParallelLmit={Object.keys(waitingUploads).length > maxParallelUploads}
            onUpload={handleUploadProcess}
            loading={loading}
            progress={uploadContainerProgress}
            type="document"
            abort={handleCancelSingleUpload}
            abortAll={handleCancelAllUploads}
            setUploadUrls={setUploadUrls}
            uploadUrls={uploadUrls}
            onRemoveUrl={removeUrl}
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
