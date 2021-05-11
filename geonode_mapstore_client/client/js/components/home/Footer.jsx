/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import Menu from '@js/components/Menu';

const Footer = forwardRef(({
    footerItems,
    style
}, ref) => {

    return (
        <footer
            ref={ref}
            className="gn-footer"
            style={style}
        >
            <div>
                <Menu
                    items={footerItems}
                />
            </div>
        </footer>
    );
});

Footer.defaultProps = {
    footerItems: []
};

export default Footer;
