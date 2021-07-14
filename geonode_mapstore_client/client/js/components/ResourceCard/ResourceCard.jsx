/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef } from 'react';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/FaIcon';
import Tag from '@js/components/Tag';
import Dropdown from '@js/components/Dropdown';
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
        <div
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
                <img
                    className={`${(layoutCardsStyle === 'list') ? 'card-img-left' : 'card-img-top'}`}
                    src={res.thumbnail_url}
                />
                <div className="card-body">
                    <div className="card-title">
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
                        <a href={formatHref({
                            pathname: `/detail/${res.resource_type}/${res.pk}`
                        })}>
                            {res.title}
                        </a>
                    </div>
                    <p
                        className="card-text gn-card-description"
                    >
                        {res.raw_abstract ? res.raw_abstract : '...'}
                    </p>
                    <p
                        className="card-text gn-card-user"
                    >
                        <Message msgId="gnhome.author"/>: <a href={formatHref({
                            query: {
                                'filter{owner.username.in}': res.owner.username
                            }
                        })}>{getUserName(res.owner)}</a>
                    </p>

                </div>
                {options && options.length > 0 && <Dropdown
                    className="gn-card-options"
                    pullRight
                >
                    <Dropdown.Toggle
                        id={`gn-card-options-${res.pk}`}
                        variant="default"
                        size="sm"
                        noCaret
                    >
                        <FaIcon name="ellipsis-h" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu  className={`gn-card-dropdown`}  >
                        {options
                            .map((opt) => {

                                const viewResourcebase = opt.perms.filter(obj => {
                                    return obj.value === "view_resourcebase";
                                });

                                return (
                                    <Dropdown.Item
                                        key={opt.href}
                                        href={
                                            (viewResourcebase.length > 0 ) ? formatHref({
                                                pathname: `/detail/${res.resource_type}/${res.pk}`
                                            }) : buildHrefByTemplate(res, opt.href)
                                        }
                                    >
                                        <FaIcon name={opt.icon} /> <Message msgId={opt.labelId}/>
                                    </Dropdown.Item>
                                );
                            })}
                    </Dropdown.Menu>
                </Dropdown>}
            </div>
        </div>
    );
});

ResourceCard.defaultProps = {
    links: [],
    theme: 'light',
    getTypesInfo: getResourceTypesInfo
};

export default ResourceCard;
