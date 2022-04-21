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
import Message from '@mapstore/framework/plugins/locale/Message';

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

function SharePageLink({resourceType, embedUrl}) {
    const pageUrl = cleanUrl(window.location.href);
    const [copied, setCopied] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);
    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 1000);
        }
        if (copiedEmbed) {
            setTimeout(() => {
                setCopiedEmbed(false);
            }, 1000);
        }
    }, [copied, copiedEmbed]);
    return (
        <div style={{ padding: '10px'}}>
            <div className="gn-share-link-wrapper">
                <div className="gn-share-link">
                    <span className="gn-share-title"><Message msgId="gnviewer.thisPage" />:</span><input
                        readOnly
                        rel="noopener noreferrer"
                        target="_blank"
                        value={pageUrl}
                    />
                    {!copied && <CopyToClipboard
                        text={pageUrl}
                    >
                        <Button
                            size="sm"
                            onClick={() => setCopied(true)}
                        >
                            <FaIcon name="copy" />
                        </Button>
                    </CopyToClipboard>}
                    {copied && <Button size="sm"><FaIcon name="check" /></Button>}
                </div>
                <div className="gn-share-link">
                    {resourceType ? <span className="gn-share-title"><Message msgId={`gnhome.${resourceType}`} />:</span> : null}
                    <input
                        readOnly
                        rel="noopener noreferrer"
                        target="_blank"
                        value={embedUrl}
                    />
                    {!copiedEmbed && <CopyToClipboard
                        text={embedUrl}
                    >
                        <Button
                            size="sm"
                            onClick={() => setCopiedEmbed(true)}
                        >
                            <FaIcon name="copy" />
                        </Button>
                    </CopyToClipboard>}
                    {copiedEmbed && <Button size="sm"><FaIcon name="check" /></Button>}
                </div>
            </div>
        </div>
    );
}

export default SharePageLink;
