/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';

const OverlayContainer = forwardRef(({
    enabled,
    style,
    children
}, ref) => {

    if (!enabled) {
        return null;
    }

    return (
        <div
            ref={ref}
            className="gn-overlay-container"
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                ...style
            }}
        >
            {children}
        </div>
    );
});

export default OverlayContainer;
