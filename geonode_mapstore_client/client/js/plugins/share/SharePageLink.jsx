/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import Button from '@mapstore/framework/components/layout/Button';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
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
                                <Icon glyph="copy" />
                            </Button>
                        </CopyToClipboard>}
                        {copied && <Button size="sm"><Icon glyph="check" /></Button>}</div>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default SharePageLink;
