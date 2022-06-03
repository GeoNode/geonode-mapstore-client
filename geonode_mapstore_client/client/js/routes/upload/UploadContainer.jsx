/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useRef } from 'react';
import Dropzone from 'react-dropzone';
import ViewerLayout from '@js/components/ViewerLayout';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import { Alert } from 'react-bootstrap';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import PendingUploadCard from '@js/routes/upload/PendingUploadCard';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';

function ErrorButton(props) {
    return (
        <div {...props} style={{ width: 'fit-content', margin: 'auto' }} className="gn-disabled-upload">
            <Button disabled variant="primary">
                <Message msgId="gnviewer.upload" />
            </Button>
        </div>
    );
}

const ButtonWithTooltip = tooltip(ErrorButton);

function UploadContainer({
    waitingUploads,
    children,
    onDrop,
    supportedLabels,
    onRemove,
    unsupported,
    disabledUpload,
    disableOnParallelLmit,
    onUpload,
    loading,
    progress,
    type,
    abort,
    abortAll
}) {

    const inputFile = useRef();
    const waitingUploadNames = Object.keys(waitingUploads);

    const handleFileDrop = (event) => {
        const files = [...event?.target?.files];
        return onDrop(files);
    };

    const getSize = (filesObj, extensions) => {
        let bytes = 0;
        extensions.forEach(ext => {
            bytes += filesObj[ext].size;
        });

        return Math.ceil(bytes / (1024 * 1024));
    };

    const { datasetMaxUploadSize, documentMaxUploadSize, maxParallelUploads } = getConfigProp('geoNodeSettings');
    const maxAllowedBytes = type === 'dataset' ? datasetMaxUploadSize : documentMaxUploadSize;
    const maxAllowedSize = Math.floor(maxAllowedBytes / (1024 * 1024));


    const getExceedingFileSize = (waitingFiles, limit) => {
        let aFileExceeds = false;
        waitingFiles.every((baseName) => {
            const { files } = waitingUploads[baseName];
            const filesExt = Object.keys(files);
            const size = getSize(files, filesExt);

            if (size > limit) {
                aFileExceeds = true;
                return false;
            } return true;
        });

        return aFileExceeds;
    };

    return (
        <Dropzone
            multiple
            onDrop={onDrop}
            className="gn-upload-dataset"
            activeClassName="gn-dropzone-active"
            rejectClassName="gn-dropzone-reject"
            disableClick
            maxFiles={maxParallelUploads}
        >
            <ViewerLayout
                leftColumn={
                    <div className="gn-upload-list">
                        <div className="gn-upload-list-header">
                            <input disabled={loading} ref={inputFile} value="" type="file" multiple onChange={handleFileDrop} style={{ display: 'none' }} />
                            <Button onClick={() => inputFile?.current?.click()}>
                                <FaIcon name="plus" />{' '}<Message msgId="gnviewer.selectFiles" />
                            </Button>
                        </div>
                        {waitingUploadNames.length > 0 ? (
                            <ul>
                                {waitingUploadNames.map((baseName) => {
                                    const { files, missingExt = [], error, addMissingFiles = false } = waitingUploads[baseName];
                                    const filesExt = Object.keys(files);
                                    const size = getSize(files, filesExt);
                                    return (
                                        <li
                                            key={baseName}
                                        >
                                            <PendingUploadCard
                                                missingExt={missingExt}
                                                baseName={baseName}
                                                onRemove={() => onRemove(baseName)}
                                                filesExt={filesExt}
                                                loading={loading}
                                                progress={progress}
                                                size={size}
                                                onAbort={abort}
                                                error={error}
                                                addMissingFiles={addMissingFiles}
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
                                <div><Message msgId="gnviewer.supportedFiles" />: {supportedLabels}</div>
                            </div>
                        )}
                        <div className="gn-upload-list-footer">
                            {unsupported.length > 0 ? <Alert bsStyle="danger">
                                <Message msgId="gnviewer.unsupportedFiles" />: {unsupported.map(({ file }) => file?.name).join(', ')}
                            </Alert> : null}
                            {(waitingUploadNames.length > 0 && getExceedingFileSize(waitingUploadNames, maxAllowedSize)) ?
                                <ButtonWithTooltip noTooltipWhenDisabled tooltip={<Message msgId="gnviewer.exceedingFileMsg" msgParams={{ limit: maxAllowedSize }} />} >
                                    <Message msgId="gnviewer.upload" />
                                </ButtonWithTooltip>
                                : disableOnParallelLmit ?
                                    <ButtonWithTooltip noTooltipWhenDisabled tooltip={<Message msgId="gnviewer.parallelUploadLimit" msgParams={{ limit: maxParallelUploads }} />} >
                                        <Message msgId="gnviewer.upload" />
                                    </ButtonWithTooltip>
                                    :
                                    !loading ? <Button
                                        variant="primary"
                                        disabled={disabledUpload}
                                        onClick={onUpload}
                                    >
                                        <Message msgId="gnviewer.upload" />
                                    </Button> : <Button
                                        variant="primary"
                                        onClick={() => abortAll(waitingUploadNames)}
                                    >
                                        <Message msgId="gnviewer.cancelUpload" />
                                    </Button>}
                        </div>
                    </div>
                }
            >
                {children}
            </ViewerLayout>
        </Dropzone>
    );
}

export default UploadContainer;
