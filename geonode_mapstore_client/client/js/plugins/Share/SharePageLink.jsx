/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import { Glyphicon } from 'react-bootstrap';

import Button from '@mapstore/framework/components/layout/Button';
import CopyToClipboard from 'react-copy-to-clipboard';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';


function SharePageLink({label, value, collapsible = true, children}) {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

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
                    <FlexBox
                        centerChildrenVertically
                        className={`gn-share-title-header ${collapsible ? 'collapsible' : ''}`}
                        {...(collapsible && {
                            onClick: () => setIsExpanded(!isExpanded),
                            style: { cursor: 'pointer' }
                        })}
                    >
                        <label className="gn-share-title">{label}</label>
                        {collapsible && <Glyphicon glyph={isExpanded ? "chevron-down" : "chevron-right"}/>}
                    </FlexBox>
                    {(!collapsible || isExpanded) && (
                        <div className={`gn-share-content ${collapsible ? 'collapsible' : ''}`}>
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
                                        <Glyphicon glyph="copy" />
                                    </Button>
                                </CopyToClipboard>}
                                {copied && <Button size="sm"><Glyphicon glyph="ok" /></Button>}
                            </div>
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SharePageLink;
