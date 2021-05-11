/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import SwipeMenu from '@js/components/home/SwipeMenu';
import MenuItem from '@js/components/Menu/MenuItem';
import Menu from '@js/components/Menu';

const MenuIndex = forwardRef(({
    style,
    leftItems,
    rightItems,
    query,
    formatHref,
    tools
}, ref) => {


    return (
        <nav
            ref={ref}
            className="gn-menu-index"
            style={style}
        >
            <div className="gn-menu-index-container">
                <ReactResizeDetector handleHeight>
                    {({ height }) => (
                        <div
                            className="gn-menu-index-content"
                            style={{ height }}
                        >
                            <SwipeMenu
                                items={leftItems}
                                menuItemComponent={MenuItem}
                                menuItemsProps={{
                                    query,
                                    formatHref
                                }}
                            />
                        </div>
                    )}
                </ReactResizeDetector>
                {tools && <div className="gn-menu-index-tools">
                    <Menu
                        items={rightItems}
                        containerClass={`gn-brand-navbar-right-side`}
                        childrenClass={`gn-user-dropdown`}
                        formatHref={formatHref}
                        query={query}
                    />
                    {tools}
                </div>}
            </div>
        </nav>
    );
});

MenuIndex.propTypes = {
    style: PropTypes.object,
    leftItems: PropTypes.array,
    rightItems: PropTypes.array,
    query: PropTypes.object,
    formatHref: PropTypes.func,
    tools: PropTypes.node
};

MenuIndex.defaultProps = {
    leftItems: [],
    rightItems: [],
    query: {},
    formatHref: () => '#'
};

export default MenuIndex;
