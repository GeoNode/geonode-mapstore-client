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
import moment from 'moment';

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
                {createDate && <div>{moment(createDate).format('MMMM Do YYYY, h:mm:ss a')}</div>}
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
                    {detailUrl
                        ? <Button
                            variant="primary"
                            size="xs"
                            href={detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
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

export default UploadCard;
