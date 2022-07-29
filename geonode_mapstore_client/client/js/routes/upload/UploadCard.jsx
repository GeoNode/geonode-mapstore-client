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
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { getUploadErrorMessageFromCode } from '@js/utils/ErrorUtils';

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
    error,
    type,
    status,
    errorLog
}) {

    const { datasetMaxUploadSize, documentMaxUploadSize, maxParallelUploads } = getConfigProp('geoNodeSettings') || {};
    const maxAllowedBytes = type !== 'document' ? datasetMaxUploadSize : documentMaxUploadSize;
    const maxAllowedSize = Math.floor(maxAllowedBytes / (1024 * 1024));

    return (
        <div className="gn-upload-card">
            <div className="gn-upload-card-header">
                {(state === 'INVALID' || status === 'failed') ? <div className="gn-upload-card-error"><FaIcon name="exclamation" /></div> : null}
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
                {((progress < 100 && progress > 0) || status === 'running') ? <Spinner /> : null}
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
                            variant="primary"
                            href={resumeUrl}
                        >
                            <Message msgId="gnviewer.completeUpload" />
                        </Button>
                        : null}
                    {(detailUrl || status === 'finished')
                        ? <Button
                            variant="primary"
                            href={detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Message msgId="gnviewer.view" />
                        </Button>
                        : null}
                    {(state === 'INVALID' || status === 'failed')
                        ? <>
                            {!errorLog ? <ErrorMessageWithTooltip tooltipId={<Message msgId={`gnviewer.${getUploadErrorMessageFromCode(error?.code)}`} msgParams={{ limit: getUploadErrorMessageFromCode(error?.code) === 'fileExceeds' ? maxAllowedSize : maxParallelUploads }} />} />
                                : <ErrorMessageWithTooltip tooltip={getUploadErrorMessageFromCode(null, errorLog)} />
                            }
                        </>
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

UploadCard.defaultProps = {
    name: '',
    state: '',
    progress: 0,
    type: 'document',
    status: ''
};

export default UploadCard;
