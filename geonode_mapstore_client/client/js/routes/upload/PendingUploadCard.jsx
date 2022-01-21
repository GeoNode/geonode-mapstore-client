
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

function PendingUploadCard({
    missingExt,
    baseName,
    onRemove,
    filesExt
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
                Missing files: {missingExt.join(', ')}
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
        </div>
    );
}

export default PendingUploadCard;
