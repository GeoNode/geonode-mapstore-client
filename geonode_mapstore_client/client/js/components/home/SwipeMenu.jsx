/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef } from 'react';
import { Button } from 'react-bootstrap-v1';
import FaIcon from '@js/components/home/FaIcon';
import useSwipeControls from '@mapstore/framework/components/geostory/common/hooks/useSwipeControls';
import { withResizeDetector } from 'react-resize-detector';

const SwipeMenu = withResizeDetector(({
    items,
    width,
    deltaSwipeSize = 200,
    menuItemComponent,
    menuItemsProps
}) => {

    const {
        isStartControlActive,
        isEndControlActive,
        containerPropsHandlers,
        contentPropsHandlers,
        itemPropsHandlers,
        moveToDeltaSize
    } = useSwipeControls({
        direction: 'horizontal',
        width,
        transition: 300,
        deltaScroll: deltaSwipeSize
    });
    const containerNode = useRef();
    const { ...containerProps } = containerPropsHandlers();
    return (
        <div
            {...containerProps}
            ref={(node) => {
                containerProps.ref(node);
                containerNode.current = node;
            }}
            className="gn-swipe-menu"
        >
            <ul {...contentPropsHandlers()}>
                {items.map((item, idx) => {
                    const { tabindex, ...itemProps } = itemPropsHandlers({
                        id: item.id || idx,
                        onClick: () => {}
                    });
                    const MenuItem = menuItemComponent;
                    return (
                        <li
                            {...itemProps}
                            draggable={false}
                            tabIndex={-1}
                        >
                            <MenuItem
                                tabIndex={tabindex}
                                item={{ ...item, id: item.id || idx }}
                                draggable={false}
                                menuItemsProps={menuItemsProps}
                                containerNode={containerNode.current}
                            />
                        </li>
                    );
                })}
            </ul>
            {isStartControlActive && <Button
                variant="default"
                style={{ position: 'absolute' }}
                size="sm"
                onClick={() => moveToDeltaSize(deltaSwipeSize)}>
                <FaIcon name="arrow-left"/>
            </Button>}
            {isEndControlActive && <Button
                variant="default"
                style={{
                    position: 'absolute',
                    right: 0
                }}
                size="sm"
                onClick={() => moveToDeltaSize(-deltaSwipeSize)}>
                <FaIcon name="arrow-right"/>
            </Button>}
        </div>
    );
});

export default SwipeMenu;
