/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef, useRef, cloneElement, Children } from 'react';
import Menu from '@js/components/Menu';

const BrandNavbar = forwardRef(({
    style,
    logo,
    navItems,
    children,
    centerMinWidth,
    inline
}, ref) => {

    const centerNode = useRef();
    const centerWidth = centerNode.current
        ? centerNode.current.getBoundingClientRect().width
        : Infinity;

    return (
        <nav
            ref={ref}
            className="gn-brand-navbar"
            style={style}
        >
            <div className="gn-brand-navbar-container" style={inline ? {} : { flexWrap: 'wrap' }}>
                <ul
                    className="gn-brand-navbar-left-side"
                >
                    {logo.map(({ src, label, href, style: logoStyle }, idx) => {
                        return (
                            <li key={idx}>
                                <a href={href}>
                                    <img src={src} style={logoStyle}/>
                                    {label}
                                </a>
                            </li>
                        );
                    })}
                </ul>
                {inline && <div
                    className="gn-brand-navbar-center"
                    ref={centerNode}
                >
                    {centerWidth >= centerMinWidth && children}
                </div>}
                <Menu
                    items={[...navItems].reverse()}
                    containerClass={`gn-brand-navbar-right-side`}
                    childrenClass={`gn-user-dropdown`}
                    alignRight
                />

            </div>
            {children && (inline && centerWidth < centerMinWidth
            || !inline) &&
                Children.map(children, child =>
                    cloneElement(child, {
                        style: {
                            ...child.props.style,
                            margin: '0.5rem auto 0 auto',
                            width: 'calc(100% - 1rem)'
                        }
                    }))}
        </nav>
    );
});

BrandNavbar.defaultProps = {
    logo: [],
    links: [],
    centerMinWidth: 400
};

export default BrandNavbar;
