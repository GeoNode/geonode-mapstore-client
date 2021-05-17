/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


import React from 'react';
import PropTypes from 'prop-types';
import Message from '@mapstore/framework/components/I18N/Message';
import { Dropdown, Badge, Nav } from 'react-bootstrap-v1';
import { createPortal } from 'react-dom';
import FaIcon from '@js/components/home/FaIcon';
import {
    isValidBadgeValue
} from '@js/utils/MenuUtils';

const itemElement = ({ labelId, href, badge }) =>  (
    <>
        <Nav.Link href={href}>{labelId && <Message msgId={labelId} />}
            { isValidBadgeValue(badge) && <Badge>{badge}</Badge>}
        </Nav.Link>
    </>);

const itemsList = (items) => ( items && items.map(({ labelId, href, badge }) => itemElement({ labelId, href, badge })));

/**
 * DropdownList component
 * @name DropdownList
 * @memberof components.Menu.DropdownList
 * @prop {number} id to apply to toogle
 * @prop {array} items list od items of Dropdown
 * @prop {string} label label to apply to toogle
 * @prop {string} labelId alternative to label
 * @prop {string} labelId alternative to labe
 * @prop {object} toogleStyle inline style to apply to toogle comp
 * @prop {string} toogleImage image to apply to toogle comp
 * @prop {string} toogleIcon icon to apply to toogle comp
 * @prop {string} dropdownClass the css class to apply to the comp
 * @prop {number} tabIndex define navigation order
 * @prop {number} badgeValue to apply the value to the item in list
 * @prop {node} containerNode the node to append the child element into a DOM
 * @example
 *  <DropdownList
 *           id={id}
 *           items={items}
 *           label={label}
 *           labelId={labelId}
 *           toogleStyle={style}
 *           toogleImage={image}
 *           toogleIcon={icon}
 *           state={state}
 *           dropdownClass={classItem}
 *           tabIndex={tabIndex}
 *           badgeValue={badgeValue}
 *           containerNode={containerNode}
 *       />
 *
 */


const DropdownList = ({
    id,
    items,
    label,
    labelId,
    toogleStyle,
    toogleImage,
    toogleIcon,
    dropdownClass,
    tabIndex,
    badgeValue,
    containerNode,
    size,
    alignRight
}) => {

    const dropdownItems = items
        .map((itm, idx) => {
            if (itm.type === 'divider') {
                return <Dropdown.Divider key={idx} />;
            }
            return (
                <>
                    <Dropdown.Item
                        key={idx}
                        href={itm.href}
                        style={itm.style}
                        as={itm?.items ? 'span' : 'a' }
                    >
                        {itm.labelId && <Message msgId={itm.labelId} /> || itm.label}
                        {isValidBadgeValue(itm.badge) && <Badge>{itm.badge}</Badge>}
                    </Dropdown.Item>

                    {itm?.items && <div className={`gn-sub-flat-menu-block`}>
                        {itemsList(itm?.items)}
                    </div>}
                </>
            );
        });

    const DropdownToogle = (
        <Dropdown.Toggle
            id={ `gn-toggle-dropdown-${id}`}
            variant={`default`}
            tabIndex={tabIndex}
            style={toogleStyle}
            size={size}
        >
            {toogleImage
                ? <img src={toogleImage} />
                : undefined
            }
            {
                toogleIcon ? <FaIcon name={toogleIcon} />
                    : undefined
            }

            {labelId && <Message msgId={labelId} /> || label}
            {isValidBadgeValue(badgeValue) && <Badge>{badgeValue}</Badge>}
        </Dropdown.Toggle>

    );


    return (
        <Dropdown
            className={`${dropdownClass}`}
            alignRight={alignRight}
        >
            {DropdownToogle}
            {containerNode
                ? createPortal(<Dropdown.Menu>
                    {dropdownItems}
                </Dropdown.Menu>, containerNode.parentNode)
                : <Dropdown.Menu>
                    {dropdownItems}
                </Dropdown.Menu>}
        </Dropdown>
    );

};

DropdownList.propTypes = {
    id: PropTypes.number,
    items: PropTypes.array.isRequired,
    label: PropTypes.string,
    labelId: PropTypes.string,
    toogleStyle: PropTypes.object,
    toogleImage: PropTypes.string,
    state: PropTypes.object,
    dropdownClass: PropTypes.string,
    tabIndex: PropTypes.number,
    badgeValue: PropTypes.number,
    containerNode: PropTypes.element

};

export default DropdownList;
