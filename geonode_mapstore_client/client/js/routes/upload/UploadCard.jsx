/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Spinner from '@js/components/Spinner';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import Message from '@mapstore/framework/components/I18N/Message';
import moment from 'moment';

function ErrorMessage(props) {
    return (
        <div {...props} className="gn-upload-card-error-message">
            <Message msgId="gnviewer.invalidUploadMessageError" /> <FaIcon name="info-circle"/>
        </div>
    );
}

const ErrorMessageWithTooltip = tooltip(ErrorMessage);


function UploadCard({
    name,
    state,
    detailUrl,
    progress,
    createDate,
    resumeUrl,
    onRemove,
    error
}) {
    const exceedingSizeError = (err) => {
        let message = err?.message?.match('File size') || '';
        let fileExceeds = false;
        if (message) {
            fileExceeds = true;
        }
        return fileExceeds;
    };

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
            <div className="gn-upload-card-footer">
                <div className="gn-upload-card-date">
                    {createDate && <div>{moment(createDate).format('MMMM Do YYYY, h:mm:ss a')}</div>}
                </div>
                <div className="gn-upload-card-tools">
                    {resumeUrl
                        ? <Button
                            variant="warning"
                            href={resumeUrl}
                        >
                            <Message msgId="gnviewer.completeUpload" />
                        </Button>
                        : null}
                    {detailUrl
                        ? <Button
                            variant="primary"
                            href={detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Message msgId="gnviewer.view" />
                        </Button>
                        : null}
                    {state === 'INVALID'
                        ? exceedingSizeError(error) ? <ErrorMessageWithTooltip tooltipId="gnviewer.fileExceeds" /> : <ErrorMessageWithTooltip tooltipId="gnviewer.invalidUploadMessageErrorTooltip" />
                        : null}
                </div>
            </div>
            <div
                className={`gn-upload-card-progress ${state && state.toLowerCase() || ''}`}
                style={{
                    width: '100%',
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

export default UploadCard;
