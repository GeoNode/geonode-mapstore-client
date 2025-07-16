/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState } from 'react';
import { Glyphicon } from 'react-bootstrap';
import Button from '@mapstore/framework/components/layout/Button';
import Message from '@mapstore/framework/components/I18N/Message';

function DetailsPreview({
    resource
}) {

    const [showPreview, setShowPreview] = useState(false);
    const {
        embedUrl
    } = resource?.['@extras']?.info || {};

    return embedUrl ? (
        <div className="_padding-sm">
            <Button size="sm" style={{ padding: 0 }} borderTransparent className="_margin-b-sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview
                    ? <><Glyphicon glyph="bottom"/> {' '}<Message msgId="gnviewer.hidePreview" /></>
                    : <><Glyphicon glyph="next"/> {' '}<Message msgId="gnviewer.showPreview" /></>}
            </Button>
            {showPreview ? <div style={{ width: '100%', aspectRatio: '16 / 9', position: 'relative' }} className="ms-secondary-colors">
                <iframe
                    key={embedUrl}
                    src={embedUrl}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%'
                    }}
                    frameBorder="0"
                />
            </div> : null}
        </div>
    ) : null;
}

export default DetailsPreview;
