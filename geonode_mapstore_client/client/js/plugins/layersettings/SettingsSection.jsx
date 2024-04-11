/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import { Glyphicon } from 'react-bootstrap';

function SettingsSection({
    expanded: expandedProp,
    title,
    children,
    onChange
}) {
    const [expanded, setExpanded] = useState(expandedProp);
    useEffect(() => {
        if (onChange) {
            onChange(expanded);
        }
    }, [expanded]);
    return (
        <>
            <div className="gn-layer-settings-section-title" onClick={() => setExpanded(!expanded)}>
                <Glyphicon glyph={`${expanded ? 'bottom' : 'next'}`}/>&nbsp;
                {title}
            </div>
            {expanded ? children : null}
            <hr/>
        </>
    );
}

export default SettingsSection;
