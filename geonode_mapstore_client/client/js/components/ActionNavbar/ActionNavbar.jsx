/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Menu from '@js/components/Menu';
import BurgerMenu from '@js/components/Menu/BurgerMenu';
import useResizeElement from '@js/hooks/useResizeElement';


const LeftContentMenu = ({ items, formatHref, query, variant, size }) => {

    const navbarContentLeft = useRef();
    const navbarLeft = useRef();
    const { width: widthContentLeft } = useResizeElement(navbarContentLeft);
    const { width: widthNavbarLeft } = useResizeElement(navbarLeft);
    const [switchToBurgerMenu, setSwitchToBurgerMenu] = useState(false);
    useEffect(() => {
        setSwitchToBurgerMenu(widthNavbarLeft >= widthContentLeft);
    }, [widthNavbarLeft, widthContentLeft]);

    return (
        <div
            className={`gn-menu-content-side gn-menu-content-left`}
            ref={navbarContentLeft}
        >
            {
                (switchToBurgerMenu) && items && <BurgerMenu items={items} variant={variant}/>
            }

            { (!switchToBurgerMenu) && items &&

                <Menu
                    ref={navbarLeft}
                    items={items}
                    containerClass={`gn-menu-list`}
                    formatHref={formatHref}
                    query={query}
                    variant={variant}
                    size={size}
                />

            }
        </div>

    );
};


const RightContentMenu = ({ items, formatHref, query, parentRef, cfg, variant, size }) => {

    const navbarContentRight = useRef();
    const navbarRight = useRef();
    const { width: widthNavbarRight } = useResizeElement(navbarRight);
    const { width: widthParent } = useResizeElement(parentRef);
    const { width: widthNavbarContentRight } = useResizeElement(navbarContentRight);
    const isSpaceRight = (cfg?.style) ? widthNavbarRight >= widthNavbarContentRight :  widthNavbarRight >= widthParent;
    const [switchToBurgerMenu, setSwitchToBurgerMenu] = useState(false);
    useEffect(() => {
        setSwitchToBurgerMenu(isSpaceRight);
    }, [isSpaceRight]);

    return (
        <div
            ref={navbarContentRight}
            className={`gn-menu-content-right`}
            style={cfg?.style}
        >

            {
                (switchToBurgerMenu) && items && <BurgerMenu items={items} variant={variant}/>
            }

            {(!switchToBurgerMenu) && items &&
                <Menu
                    ref={navbarRight}
                    items={items}
                    containerClass={`gn-menu-list`}
                    formatHref={formatHref}
                    query={query}
                    variant={variant}
                    alignRight
                    size={size}
                />

            }

        </div>


    );
};


const ActionNavbar = forwardRef(({
    style,
    leftItems,
    rightItems,
    query,
    formatHref,
    cfg,
    variant,
    size,
    children
}, ref) => {

    return (
        <nav
            ref={ref}
            className={`gn-menu gn-${variant}`}
            style={style}
        >
            <div className={`gn-menu-container`}>

                <div
                    className={`gn-menu-content`}
                >

                    {
                        leftItems.length > 0 &&
                        <LeftContentMenu
                            items={leftItems}
                            formatHref={formatHref}
                            query={query}
                            variant={variant}
                            size={size}
                        />
                    }
                    {children}
                    {

                        rightItems.length > 0 &&
                        <RightContentMenu
                            items={rightItems}
                            formatHref={formatHref}
                            query={query}
                            parentRef={ref}
                            cfg={cfg?.rightContents}
                            variant={variant}
                            size={size}
                        />
                    }
                </div>


            </div>

        </nav>

    );
});

ActionNavbar.propTypes = {
    style: PropTypes.object,
    leftItems: PropTypes.array,
    rightItems: PropTypes.array,
    query: PropTypes.object,
    formatHref: PropTypes.func,
    variant: PropTypes.string
};

ActionNavbar.defaultProps = {
    leftItems: [],
    rightItems: [],
    query: {},
    formatHref: () => '#',
    variant: 'primary'
};


export default ActionNavbar;
