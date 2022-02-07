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
    className,
    children
}, ref) => {

    if (!enabled) {
        return null;
    }

    return (
        <div
            ref={ref}
            className={className ? className : "gn-overlay-container"}
            style={{
                position: 'relative',
                height: '100%'
            }}
        >
            {children}
        </div>
    );
});

export default OverlayContainer;
