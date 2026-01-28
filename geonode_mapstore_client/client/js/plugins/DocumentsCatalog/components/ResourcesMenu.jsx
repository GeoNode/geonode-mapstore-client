/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import { Dropdown, MenuItem } from 'react-bootstrap';

import Message from '@mapstore/framework/components/I18N/Message';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import Menu from '@mapstore/framework/plugins/ResourcesCatalog/components/Menu';

const ResourcesMenu = forwardRef(({
    menuItems,
    style,
    totalResources,
    loading,
    orderConfig,
    query,
    titleId,
    theme = 'main',
    menuItemsLeft = [],
    target,
    resourcesFoundMsgId,
    onSortChange
}, ref) => {


    const {
        defaultLabelId,
        options: orderOptions = [],
        variant: orderVariant,
        align: orderAlign = 'right'
    } = orderConfig || {};

    const selectedSort = orderOptions.find(({ value }) => query?.sort === value);

    const orderButtonNode = orderOptions.length > 0 &&
        <Dropdown pullRight={orderAlign === 'right'} id="sort-dropdown">
            <Dropdown.Toggle
                bsStyle={orderVariant || 'default'}
                bsSize="sm"
                noCaret
            >
                <Message msgId={selectedSort?.labelId || defaultLabelId} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
                {orderOptions.map(({ labelId, value }) => {
                    return (
                        <MenuItem
                            key={value}
                            active={value === selectedSort?.value}
                            onClick={(e) => {
                                if (onSortChange) {
                                    e.preventDefault();
                                    onSortChange(value);
                                }
                            }}
                        >
                            <Message msgId={labelId} />
                        </MenuItem>
                    );
                })}
            </Dropdown.Menu>
        </Dropdown>;

    return (
        <FlexBox
            ref={ref}
            classNames={[
                'ms-resources-menu',
                '_sticky',
                '_corner-tl',
                `ms-${theme}-colors`,
                '_padding-tb-sm'
            ]}
            column
            gap="sm"
            style={style}
        >
            {titleId
                ? <Text fontSize="lg">
                    <Message msgId={titleId} />
                </Text>
                : null}
            <FlexBox centerChildrenVertically gap="xs">
                <FlexBox.Fill flexBox centerChildrenVertically gap="sm">
                    {menuItemsLeft.map(({ Component, name }) => {
                        return (<Component key={name} query={query} />);
                    })}
                    {orderAlign === 'left' ? orderButtonNode : null}
                    <Text fontSize="sm" ellipsis>
                        {loading
                            ? <Spinner />
                            : <span><span>{totalResources}</span>{" "}<Message msgId={resourcesFoundMsgId} msgParams={{ count: totalResources }} /></span>
                        }
                    </Text>
                </FlexBox.Fill>
                <Menu
                    items={menuItems}
                    containerClass={`ms-menu-list`}
                    size="md"
                    alignRight
                    target={target}
                />
                {orderAlign === 'right' ? orderButtonNode : null}
            </FlexBox>
        </FlexBox>
    );
});

ResourcesMenu.defaultProps = {
    orderOptions: [
        {
            label: 'Most recent',
            labelId: 'resourcesCatalog.mostRecent',
            value: '-date'
        },
        {
            label: 'Less recent',
            labelId: 'resourcesCatalog.lessRecent',
            value: 'date'
        },
        {
            label: 'A Z',
            labelId: 'resourcesCatalog.aZ',
            value: 'title'
        },
        {
            label: 'Z A',
            labelId: 'resourcesCatalog.zA',
            value: '-title'
        },
        {
            label: 'Most popular',
            labelId: 'resourcesCatalog.mostPopular',
            value: 'popular_count'
        }
    ],
    defaultLabelId: 'resourcesCatalog.orderBy'
};

export default ResourcesMenu;
