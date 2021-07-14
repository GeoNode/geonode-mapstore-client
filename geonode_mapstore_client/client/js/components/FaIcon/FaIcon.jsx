/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

function FaIcon({
    name,
    className,
    style,
    stylePrefix = 'fa'
}) {
    return <i className={`${stylePrefix} fa-${name}${className ? ` ${className}` : ''}`} style={style}/>;
}

FaIcon.defaultProps = {};

export default FaIcon;
