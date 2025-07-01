/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useIsMounted from '@js/hooks/useIsMounted';
import { loadFontAwesome } from '@mapstore/framework/utils/FontUtils';

function FaIcon({
    name,
    className,
    style
}) {
    const [loading, setLoading] = useState(true);
    const isMounted = useIsMounted();
    useEffect(() => {
        loadFontAwesome()
            .then(() => {
                isMounted(() => {
                    setLoading(false);
                });
            });
    }, []);
    if (loading) {
        return null;
    }
    return <i className={`fa fa-${name}${className ? ` ${className}` : ''}`} style={style}/>;
}
/**
 * Icon component
 * @prop {string} glyph icon name
 */
function Icon({
    glyph,
    ...props
}) {
    return <FaIcon {...props} name={glyph} />;
}

Icon.propTypes = {
    glyph: PropTypes.string
};

export default Icon;
