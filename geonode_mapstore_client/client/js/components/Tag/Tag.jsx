

/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import FaIcon from '@js/components/FaIcon';
function Tag({
    active,
    children,
    href,
    className,
    style,
    draggable,
    tabIndex,
    onClick,
    showTimesIcon
}) {
    return (
        <a
            className={`gn-tag${active ? ' active' : ''}${className ? ' ' + className : ''}`}
            href={href}
            style={style}
            draggable={draggable}
            tabIndex={tabIndex}
            onClick={onClick}
        >
            {children}
            {showTimesIcon && active && <FaIcon name="times" />}
        </a>
    );
}

Tag.defaultProps = {};

export default Tag;
