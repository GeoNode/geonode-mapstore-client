/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


import React from 'react';
import PropTypes from 'prop-types';
import castArray from 'lodash/castArray';
import Badge from '@js/components/Badge';
import NavLink from './NavLink';
import Message from '@mapstore/framework/components/I18N/Message';
import DropdownList from './DropdownList';
import {
    isValidBadgeValue
} from '@js/utils/MenuUtils';

/**
 * Menu item component
 * @name MenuItem
 * @memberof components.Menu.MenuItem
 * @prop {object} item the item menu
 * @prop {object} menuItemsProps contains pros to apply to items, to manage single permissions, build href and query url
 * @prop {node} containerNode the node to append the child element into a DOM
 * @prop {number} tabIndex define navigation order
 * @prop {boolean} draggable is element is draggable
 * @prop {function} classItem class to apply to the Item
 * @example
 *  <MenuItem
 *            tabIndex={tabindex}
 *            item={{ ...item, id: item.id || idx }}
 *            draggable={false}
 *            menuItemsProps={menuItemsProps}
 *            containerNode={containerNode.current}
 *  />
 *
 */

const MenuItem = ({ item, menuItemsProps, containerNode, tabIndex, classItem = '', size, alignRight, variant, resourceName }) => {

    const { formatHref, query } = menuItemsProps;
    const { id, type, label, labelId = '', items = [], href, style, badge = '', image, Component, target, className } = item;
    const btnClassName = `btn${variant && ` btn-${variant}` || ''}${size && ` btn-${size}` || ''}${className ? ` ${className}` : ''}`;

    const badgeValue = badge;
    if (type === 'dropdown') {
        return (<DropdownList
            id={id}
            items={items}
            label={label}
            labelId={labelId}
            toogleStyle={style}
            toogleImage={image}
            dropdownClass={`${classItem}${className ? ` ${className}` : ''}`}
            tabIndex={tabIndex}
            badgeValue={badgeValue}
            containerNode={containerNode}
            size={size}
            alignRight={alignRight}
            variant={variant}
        />);
    }

    if ((type === 'custom' || type === 'plugin') && Component) {
        return <Component variant={variant} size={size} className={className}/>;
    }

    if (type === 'link') {
        return (
            <NavLink href={href} target={target} className={btnClassName}>{labelId && <Message msgId={labelId} /> || label}{item.datasetEditor && resourceName}</NavLink>
        );

    }

    if (type === 'divider') {
        return <div className="gn-menu-divider" style={style}></div>;
    }

    if (type === 'filter') {
        const active = castArray(query.f || []).find(value => value === item.id);
        return (
            <NavLink
                target={target}
                style={style}
                href={formatHref({
                    query: { f: item.id },
                    replaceQuery: active ? false : true
                })}
                className={btnClassName}
            >
                {labelId && <Message msgId={labelId} /> || label}
                {isValidBadgeValue(badgeValue) && <Badge>{badgeValue}</Badge>}
            </NavLink>
        );
    }
    return null;
};

MenuItem.propTypes = {
    item: PropTypes.object.isRequired,
    menuItemsProps: PropTypes.object.isRequired,
    containerNode: PropTypes.element,
    tabIndex: PropTypes.number,
    draggable: PropTypes.bool,
    classItem: PropTypes.string

};

export default MenuItem;
