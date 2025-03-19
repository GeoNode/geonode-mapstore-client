/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import Button from '@js/components/Button/Button';
import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@js/components/Spinner';
import ErrorMessageWithTooltip from './ErrorMessageWithTooltip';
import moment from 'moment';
import { getUploadErrorMessageFromCode } from '@js/utils/ErrorUtils';
import { getCataloguePath } from '@js/utils/ResourceUtils';

function ExecutionRequestTable({
    viewResource = true,
    editMetadata = true,
    titleMsgId = '',
    descriptionMsgId = '',
    iconName = '',
    requests: requestsProp,
    onReload,
    onDelete
}) {

    const [deleted, setDeleted] = useState([]);
    function handleDelete(deleteId) {
        setDeleted(prevDeleted => [...prevDeleted, deleteId]);
        onDelete(deleteId);
    }
    // prevent showing of deleted requests removed during this session
    const requests = requestsProp.filter(request => !deleted.includes(request.exec_id));

    if (!requests.length) {
        return (
            <div className="gn-upload-processing">
                <div className="gn-main-event-container">
                    <div className="gn-main-event-content">
                        <div className="gn-main-event-text">
                            <div className="gn-main-icon">
                                <FaIcon name={iconName}/>
                            </div>
                            <h1><Message msgId={titleMsgId}/></h1>
                            <div><Message msgId={descriptionMsgId}/></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const RenderActionButton = ({request, href, msgId}) => (
        <Button
            variant="primary"
            onClick={() => handleDelete(request.exec_id)}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
        >
            <Message msgId={msgId} />
        </Button>
    );

    return (
        <div className="gn-upload-processing">
            <div className="gn-upload-processing-list">
                <table className="table">
                    <thead>
                        <tr>
                            <th><Message msgId="gnviewer.uploadName" /></th>
                            <th><Message msgId="gnviewer.uploadCreated" /></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => {
                            const detailUrls = (request?.output_params?.resources || [])?.map(res=> res.detail_url);
                            return (
                                <tr key={request.exec_id} className={request.status === 'failed' ? 'danger' : ''}>
                                    <td><FaIcon name={iconName}/>{' '}{request.name}</td>
                                    <td>{moment(request.created).format('MMMM Do YYYY, h:mm:ss a')}</td>
                                    <td>
                                        {request.status === 'running' ? <Spinner/> : null}
                                        {request.status === 'failed'
                                            ? <ErrorMessageWithTooltip
                                                label={<Message msgId="gnviewer.invalidUploadMessageError" />}
                                                tooltipPosition="left"
                                                tooltip={request.log ? getUploadErrorMessageFromCode(null, request.log) : undefined}
                                            />
                                            : null}
                                        {!onReload && request.status === 'finished' && detailUrls?.[0]
                                            ? <div className="gn-upload-processing-actions">
                                                {viewResource && <RenderActionButton
                                                    request={request}
                                                    msgId={'gnviewer.view'}
                                                    href={detailUrls.length === 1 ? detailUrls[0] : getCataloguePath('/catalogue/#/search/?f=dataset')}
                                                /> }
                                                {editMetadata && <RenderActionButton
                                                    request={request}
                                                    msgId={'gnviewer.editMetadata'}
                                                    href={detailUrls.length === 1 ? detailUrls[0].replace(/\/[^/]+\/(\d+)$/, "/metadata/$1") : getCataloguePath('/catalogue/#/search/?f=document')}
                                                />}
                                            </div>
                                            : null}
                                        {!onReload && request.status === 'finished' && !detailUrls?.[0]
                                            ? <FaIcon name="check" />
                                            : null}
                                        {onReload && request.status === 'finished'
                                            ? <Button variant="primary" onClick={() => onReload()}>
                                                <Message msgId={'gnviewer.reload'} />
                                            </Button>
                                            : null}
                                    </td>
                                    <td>
                                        <Button onClick={() => handleDelete(request.exec_id)}>
                                            <FaIcon name="trash" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ExecutionRequestTable;
