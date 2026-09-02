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
    const cyData = className?.split(' ')
        .find(c => c !== 'page-viewer' && c.startsWith('page-') && c.endsWith('-viewer'))
        ?.slice('page-'.length);

    return (
        <div
            id={id}
            className={`${className ? `${className} ` : ''}gn-viewer-layout`}
            {...(cyData ? { 'data-ms-id': cyData } : {})}
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
                    id="container" // needed for longitudinal profile dropdown
                    className="gn-viewer-layout-center"
                    data-ms-id="map-container"
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
                <div
                    className="gn-viewer-right-overlay shadow-far ms-main-colors"
                    {...(cyData ? {'data-ms-id': `${cyData}-right-overlay`} : {})}
                >
                    {rightOverlay}
                </div>
            </div>
            <footer>
                {footer}
            </footer>
        </div>
    );
}

export default ViewerLayout;
