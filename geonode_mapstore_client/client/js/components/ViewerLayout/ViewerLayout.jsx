/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

function ViewerLayout({
    id,
    className,
    header,
    leftColumn,
    rightColumn,
    rightOverlay,
    children,
    footer
}) {

    return (
        <div
            id={id}
            className={`${className ? `${className} ` : ''}gn-viewer-layout`}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}>
            <header>
                {header}
            </header>
            <div
                className="gn-viewer-layout-body"
                style={{
                    display: 'flex',
                    width: '100%',
                    flex: 1,
                    position: 'relative'
                }}>
                <div className="gn-viewer-left-column">
                    {leftColumn}
                </div>
                <div
                    className="gn-viewer-layout-center"
                    style={{
                        flex: 1,
                        position: 'relative'
                    }}
                >
                    {children}
                </div>
                <div className="gn-viewer-right-column">
                    {rightColumn}
                </div>
            </div>
            <div
                className="gn-viewer-right-overlay shadow-far"
                style={{
                    position: 'absolute',
                    right: 0,
                    height: '100%',
                    zIndex: 2000,
                    transform: 'all 0.3s'
                }}>
                {rightOverlay}
            </div>
            <footer>
                {footer}
            </footer>
        </div>
    );
}

export default ViewerLayout;
