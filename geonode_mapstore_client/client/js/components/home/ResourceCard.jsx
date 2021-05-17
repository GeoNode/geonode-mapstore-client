/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import { Card, Dropdown } from 'react-bootstrap-v1';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/home/FaIcon';
import Tag from '@js/components/home/Tag';
import {
    getUserName,
    getResourceTypesInfo
} from '@js/utils/GNSearchUtils';
const ResourceCard = forwardRef(({
    data,
    active,
    options,
    formatHref,
    getTypesInfo,
    layoutCardsStyle,
    buildHrefByTemplate
}, ref) => {

    const res = data;
    const types = getTypesInfo();
    const { icon } = types[res.doc_type] || types[res.resource_type] || {};

    return (
        <Card
            ref={ref}
            className={`gn-resource-card${active ? ' active' : ''} gn-card-type-${layoutCardsStyle} ${layoutCardsStyle === 'list' ? 'rounded-0' : ''}`}
        >
            <a
                className="gn-resource-card-link"
                href={formatHref({
                    pathname: `/detail/${res.resource_type}/${res.pk}`
                })}
            />
            <div className={`card-resource-${layoutCardsStyle}`}>
                <Card.Img
                    variant={`${(layoutCardsStyle === 'list') ? 'left' : 'top'}`}
                    src={res.thumbnail_url}
                />
                <Card.Body>
                    <Card.Title>
                        {icon &&
                        <>
                            <Tag
                                href={formatHref({
                                    query: {
                                        'filter{resource_type.in}': res.resource_type
                                    }
                                })}>
                                <FaIcon name={icon} />
                            </Tag>
                        </>}
                        <a href={res.detail_url}>
                            {res.title}
                        </a>
                    </Card.Title>
                    <Card.Text
                        className="gn-card-description"
                    >
                        {res.raw_abstract ? res.raw_abstract : '...'}
                    </Card.Text>
                    <Card.Text
                        lassName="gn-card-user"
                    >
                        <Message msgId="gnhome.author"/>: <a href={formatHref({
                            query: {
                                'filter{owner.username.in}': res.owner.username
                            }
                        })}>{getUserName(res.owner)}</a>
                    </Card.Text>

                </Card.Body>
                {options && options.length > 0 && <Dropdown
                    className="gn-card-options"
                    alignRight
                >
                    <Dropdown.Toggle
                        id={`gn-card-options-${res.pk}`}
                        variant="default"
                        size="sm"
                    >
                        <FaIcon name="ellipsis-h" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu  className={`gn-card-dropdown`}  >
                        {options
                            .map((opt) => {

                                return (
                                    <Dropdown.Item
                                        key={opt.href}
                                        href={buildHrefByTemplate(res, opt.href)}
                                    >
                                        <FaIcon name={opt.icon} /> <Message msgId={opt.labelId}/>
                                    </Dropdown.Item>
                                );
                            })}
                    </Dropdown.Menu>
                </Dropdown>}

            </div>
        </Card>
    );
});

ResourceCard.defaultProps = {
    links: [],
    theme: 'light',
    getTypesInfo: getResourceTypesInfo
};

export default ResourceCard;
