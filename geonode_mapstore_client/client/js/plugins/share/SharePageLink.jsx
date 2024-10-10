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


function SharePageLink({label, value, children}) {
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 1000);
        }
    }, [copied]);
    return (
        <div className="gn-share-link-pad">
            <div className="gn-share-link-wrapper">
                <div className="gn-share-page-link">
                    <label className="gn-share-title">{label}</label>
                    <div className="gn-share-link">
                        <input
                            readOnly
                            rel="noopener noreferrer"
                            target="_blank"
                            value={value}
                        />
                        {!copied && <CopyToClipboard
                            text={value}
                        >
                            <Button
                                size="sm"
                                onClick={() => setCopied(true)}
                            >
                                <FaIcon name="copy" />
                            </Button>
                        </CopyToClipboard>}
                        {copied && <Button size="sm"><FaIcon name="check" /></Button>}</div>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default SharePageLink;
