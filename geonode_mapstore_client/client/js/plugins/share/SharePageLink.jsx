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
import url from 'url';

function cleanUrl(targetUrl) {
    const {
        search,
        ...params
    } = url.parse(targetUrl);
    const hash = params.hash && `#${cleanUrl(params.hash.replace('#', ''))}`;
    return url.format({
        ...params,
        ...(hash && { hash })
    });
}

function SharePageLink() {
    const pageUrl = cleanUrl(window.location.href);
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
            <input
                readOnly
                rel="noopener noreferrer"
                target="_blank"
                value={pageUrl}
            />
            { !copied && <CopyToClipboard
                text={pageUrl}
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

export default SharePageLink;
