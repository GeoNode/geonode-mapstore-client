/*
* Copyright 2025, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/
import React, { useLayoutEffect, useRef, useState, useCallback } from "react";

const SCROLL_THRESHOLD = 0.5;
const SCROLL_AMOUNT_PERCENTAGE = 0.8; // Scroll 80% of the container width

const withScrollableTabs = (Component) => {
    return (props) => {
        const containerRef = useRef(null);
        const [showLeftArrow, setShowLeftArrow] = useState(false);
        const [showRightArrow, setShowRightArrow] = useState(false);

        const scroll = useCallback((direction) => {
            const container = containerRef.current;
            if (container) {
                const scrollAmount = Math.floor(container.clientWidth * SCROLL_AMOUNT_PERCENTAGE);
                const targetScroll = direction === "left"
                    ? container.scrollLeft - scrollAmount
                    : container.scrollLeft + scrollAmount;
                container.scrollTo({ left: targetScroll, behavior: 'smooth'});
            }
        }, []);

        const checkScrollState = useCallback(() => {
            const container = containerRef.current;
            if (!container) return;

            const showArrow = container.scrollWidth > container.clientWidth;
            const isScrollableLeft = container.scrollLeft > 0;
            const isScrollableRight = Math.abs(container.scrollLeft - (container.scrollWidth - container.clientWidth)) > SCROLL_THRESHOLD;

            setShowLeftArrow(showArrow && isScrollableLeft);
            setShowRightArrow(showArrow && isScrollableRight);
        }, []);

        useLayoutEffect(() => {
            const container = containerRef.current = document.querySelector(props.containerEl ?? 'ul[role="tablist"]');
            if (container) {
                checkScrollState();
                container.addEventListener('scroll', checkScrollState);
                window.addEventListener('resize', checkScrollState);
            }

            return () => {
                if (container) {
                    container.removeEventListener('scroll', checkScrollState);
                    window.removeEventListener('resize', checkScrollState);
                }
            };
        }, [checkScrollState]);

        return (
            <div className="gn-scrollable-tabs _flex _flex-row _flex-nowrap _flex-align-center _relative">
                {showLeftArrow && (
                    <button className="left-arrow _absolute _corner-tl _pointer" onClick={() => scroll("left")}>
                        &#9664;
                    </button>
                )}
                <div className="gn-scrollable-tabs-container _flex ms-flex-fill">
                    <Component {...props} />
                </div>
                {showRightArrow && (
                    <button className="right-arrow _absolute _corner-tr _pointer" onClick={() => scroll("right")}>
                        &#9654;
                    </button>
                )}
            </div>
        );
    };
};

export default withScrollableTabs;
