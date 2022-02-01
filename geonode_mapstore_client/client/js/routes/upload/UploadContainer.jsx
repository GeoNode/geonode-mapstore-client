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
import PendingUploadCard from '@js/routes/upload/PendingUploadCard';

function UploadContainer({
    waitingUploads,
    children,
    onDrop,
    supportedLabels,
    onRemove,
    unsupported,
    disabledUpload,
    onUpload,
    loading,
    progress
}) {

    const inputFile = useRef();
    const waitingUploadNames = Object.keys(waitingUploads);
    return (
        <Dropzone
            multiple
            onDrop={onDrop}
            className="gn-upload-dataset"
            activeClassName="gn-dropzone-active"
            rejectClassName="gn-dropzone-reject"
            disableClick
        >
            <ViewerLayout
                leftColumn={
                    <div className="gn-upload-list">
                        <div className="gn-upload-list-header">
                            <input ref={inputFile} value="" type="file" multiple onChange={(event) => onDrop([...event?.target?.files])} style={{ display: 'none' }}/>
                            <Button onClick={() => inputFile?.current?.click()}>
                                <FaIcon name="plus"/>{' '}<Message msgId="gnviewer.selectFiles"/>
                            </Button>
                        </div>
                        {waitingUploadNames.length > 0 ? (
                            <ul style={{overflowX: 'hidden'}}>
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
                                                onRemove={() => onRemove(baseName)}
                                                filesExt={filesExt}
                                                loading={loading}
                                                progress={progress}
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
                                <div><Message msgId="gnviewer.supportedFiles"/>: {supportedLabels}</div>
                            </div>
                        )}
                        <div className="gn-upload-list-footer">
                            {unsupported.length > 0 ? <Alert bsStyle="danger">
                                <Message msgId="gnviewer.unsupportedFiles"/>: {unsupported.map(({ file }) => file?.name).join(', ')}
                            </Alert> : null}
                            <Button
                                variant="success"
                                disabled={disabledUpload}
                                onClick={onUpload}
                            >
                                <Message msgId="gnviewer.upload"/>
                            </Button>
                        </div>
                        {loading && (
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    textAlign: 'center',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    paddingBottom: '3rem'
                                }}
                            >
                                <Message msgId="gnviewer.transferInProgress"/>
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

export default UploadContainer;
