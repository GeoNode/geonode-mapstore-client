/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon/FaIcon';
import CopyToClipboard from 'react-copy-to-clipboard';

function ShareEmbedLink({
    allowFullScreen,
    shareUrl,
    width = 600,
    height = 400
}) {
    const codeEmbedded = `<iframe ${allowFullScreen ? 'allowFullScreen' : ''} style=\"border: none;\" height=\"${height || 0}\" width=\"${width || 0}\" src=\"${shareUrl}\"></iframe>`;
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 1000);
        }
    }, [copied]);
    return (
        <div className="gn-share-link">
            <textarea readOnly>
                {codeEmbedded}
            </textarea>
            { !copied && <CopyToClipboard
                text={codeEmbedded}
            >
                <Button
                    size="sm"
                    onClick={() => setCopied(true)}
                >
                    <FaIcon name="copy"/>
                </Button>
            </CopyToClipboard>}
            {copied && <Button size="sm"><FaIcon name="check"/></Button>}
        </div>
    );
}

export default ShareEmbedLink;
