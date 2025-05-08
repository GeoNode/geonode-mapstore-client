/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import Button from '@mapstore/framework/components/layout/Button';
import { Alert } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import Message from '@mapstore/framework/components/I18N/Message';
import ViewerLayout from '@js/components/ViewerLayout';
import uuidv1 from 'uuid/v1';
import uniq from 'lodash/uniq';
import { getFileNameParts } from '@js/utils/FileUtils';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import PendingUploadCard from './PendingUploadCard';
import {
    validateRemoteResourceUploads,
    getExceedingFileSize,
    validateFileResourceUploads,
    parseFileResourceUploads
} from '../../../utils/UploadUtils';
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

function UploadPanel({
    loading,
    children,
    maxParallelUploads,
    maxAllowedSize,
    supportedFiles,
    enableRemoteUploads,
    onUpload,
    onCancel,
    progress,
    errors,
    completed,
    rightColumn,
    disabled,
    getDefaultRemoteResource = value => value,
    remoteTypes,
    remoteTypesPlaceholder,
    remoteTypeErrorMessageId,
    remoteTypeFromUrl,
    isRemoteTypesDisabled
}) {

    const inputFile = useRef();

    const [uploads, setUploads] = useState([]);

    useEffect(() => {
        setUploads(prevUploads =>
            validateRemoteResourceUploads(
                prevUploads.filter(upload => !completed[upload.id]),
                { remoteTypes }
            )
        );
    }, [completed]);

    function handleAdd(newAddedUploads = []) {
        const newUploads = parseFileResourceUploads(uploads, newAddedUploads, { supportedFiles });
        setUploads(
            validateRemoteResourceUploads(
                validateFileResourceUploads(newUploads, { supportedFiles }),
                { remoteTypes }
            )
        );
    }

    function handleRemove(id) {
        setUploads(
            validateRemoteResourceUploads(
                uploads.filter((upload) => upload.id !== id),
                { remoteTypes }
            )
        );
    }

    function handleChange(changedUpload) {
        setUploads(
            validateRemoteResourceUploads(
                uploads.map((upload) => upload.id === changedUpload.id ? changedUpload : upload),
                { remoteTypes }
            )
        );
    }

    const handleFile = (files) => {
        return handleAdd(files.map((file) => {
            const { ext, baseName } = getFileNameParts(file);
            return { id: uuidv1(), type: 'file', file, ext, baseName };
        }));
    };

    const handleRemote = () => {
        return handleAdd([getDefaultRemoteResource({ id: uuidv1(), type: 'remote', url: '' })]);
    };

    const supportedLabels = uniq(supportedFiles.map(supportedFile => supportedFile.label)).join(', ');
    const uploadsList = uploads.filter(upload => upload.type === 'file' ? upload.supported : true);
    const supportedUploads = uploads.filter(upload => upload.supported);
    const readyUploads = uploads.filter(upload => upload.ready);
    const unsupportedLabels = uploads.filter(upload => upload.type === 'file' && !upload.supported).map((upload) => `${upload.baseName}.${upload?.ext?.[0] || ''}`).join(', ');
    const disabledAdd = disabled || loading || readyUploads.length === maxParallelUploads;
    return (
        <Dropzone
            multiple
            onDrop={handleFile}
            className="gn-upload-panel"
            activeClassName="gn-dropzone-active"
            rejectClassName="gn-dropzone-reject"
            disableClick
        >
            <ViewerLayout
                rightColumn={rightColumn}
                leftColumn={<div className="gn-upload-list">
                    <div className="gn-upload-list-header">
                        <input disabled={disabledAdd} ref={inputFile} value="" type="file" multiple onChange={(event) => handleFile([...event?.target?.files])} style={{ display: 'none' }} />
                        <Button disabled={disabledAdd} onClick={() => inputFile?.current?.click()}>
                            <Icon glyph="plus" /><Message msgId="gnviewer.selectFiles" />
                        </Button>
                        {enableRemoteUploads && <Button disabled={disabledAdd} className={"add-url"} onClick={() => handleRemote()}>
                            <Icon glyph="plus" /><Message msgId="gnviewer.addFromUrl" />
                        </Button>}
                    </div>
                    {uploadsList.length > 0
                        ? (
                            <ul>
                                {uploadsList.map((upload) => {
                                    return (
                                        <li key={upload.id}>
                                            <PendingUploadCard
                                                data={upload}
                                                progress={progress[upload.id]}
                                                loading={loading}
                                                error={errors[upload.id]}
                                                onCancel={onCancel}
                                                remoteTypes={remoteTypes}
                                                isRemoteTypesDisabled={isRemoteTypesDisabled}
                                                remoteTypesPlaceholder={remoteTypesPlaceholder}
                                                remoteTypeErrorMessageId={remoteTypeErrorMessageId}
                                                remoteTypeFromUrl={remoteTypeFromUrl}
                                                onRemove={handleRemove}
                                                onChange={handleChange}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                        : (
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
                        {unsupportedLabels ? <Alert bsStyle="danger">
                            <Message msgId="gnviewer.unsupportedFiles" />{unsupportedLabels ? `: ${unsupportedLabels}` : ''}
                        </Alert> : null}
                        {(uploads.length > 0 && getExceedingFileSize(uploads, maxAllowedSize)) ?
                            <ButtonWithTooltip noTooltipWhenDisabled tooltip={<Message msgId="gnviewer.exceedingFileMsg" msgParams={{ limit: maxAllowedSize }} />} >
                                <Message msgId="gnviewer.upload" />
                            </ButtonWithTooltip>
                            : supportedUploads.length > maxParallelUploads ?
                                <ButtonWithTooltip noTooltipWhenDisabled tooltip={<Message msgId="gnviewer.parallelUploadLimit" msgParams={{ limit: maxParallelUploads }} />} >
                                    <Message msgId="gnviewer.upload" />
                                </ButtonWithTooltip>
                                :
                                !loading ? <Button
                                    variant="primary"
                                    disabled={readyUploads.length === 0 || disabled}
                                    onClick={() => onUpload(readyUploads)}
                                >
                                    <Message msgId="gnviewer.upload" />
                                </Button> : <Button
                                    variant="primary"
                                    onClick={() => onCancel(readyUploads.map((upload) => upload.id))}
                                >
                                    <Message msgId="gnviewer.cancelUpload" />
                                </Button>}
                    </div>
                    {disabled ? <div className="gn-upload-list-cover" /> : null}
                </div>}
            >
                {children}
            </ViewerLayout>
        </Dropzone>
    );
}

export default UploadPanel;
