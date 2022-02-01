
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
import Badge from '@js/components/Badge';
import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@js/components/Spinner';


function PendingUploadCard({
    missingExt,
    baseName,
    onRemove,
    filesExt,
    loading,
    progress
}) {
    return (
        <div className="gn-upload-card">
            <div className="gn-upload-card-header">
                {missingExt.length > 0 ? <div className="gn-upload-card-error"><FaIcon name="exclamation"/></div> : null}
                <div className="gn-upload-card-title">{baseName}</div>
                {onRemove
                    ? <Button size="xs" onClick={onRemove}>
                        <FaIcon name="trash"/>
                    </Button>
                    : null}
            </div>
            {missingExt.length > 0 && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId="gnviewer.missingFiles"/>: {missingExt.join(', ')}
                </div>
            </div>}
            {<ul>
                {filesExt.map(ext => {
                    return (
                        <li key={ext}>
                            <Badge>.{ext}</Badge>
                        </li>
                    );
                })}
            </ul>}
            {loading && progress && <div style={{position: 'relative'}}>
                <div
                    className="gn-upload-card-progress"
                    style={{
                        width: '100%',
                        height: 2
                    }}
                >
                    <div
                        style={{
                            width: `${progress?.[baseName]}%`,
                            height: 2,
                            transition: '0.3s all'
                        }}
                    >
                    </div>
                </div>
                <div className="gn-upload-card-progress-read" style={{left: progress?.[baseName] < 88 ? `${progress?.[baseName]}%` : '88%'}}>{progress?.[baseName] ? `${progress?.[baseName]}%` : <Spinner />}</div>
            </div>}
        </div>
    );
}

export default PendingUploadCard;
