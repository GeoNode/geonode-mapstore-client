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
import Dropdown from '@js/components/Dropdown';
import Spinner from '@js/components/Spinner';
import { getUserName } from '@js/utils/SearchUtils';
import { getResourceTypesInfo } from '@js/utils/ResourceUtils';
import ResourceStatus from '@js/components/ResourceStatus/';

function ALink({ href, readOnly, children }) {
    return readOnly ? children : <a href={href}>{children}</a>;
}

const ResourceCard = forwardRef(({
    data,
    active,
    options,
    formatHref,
    getTypesInfo,
    layoutCardsStyle,
    buildHrefByTemplate,
    readOnly,
    actions,
    onAction,
    className,
    loading
}, ref) => {
    const res = data;
    const types = getTypesInfo();
    const { icon } = types[res.subtype] || types[res.resource_type] || {};

    return (
        <div
            ref={ref}
            className={`gn-resource-card${active ? ' active' : ''}${readOnly ? ' read-only' : ''} gn-card-type-${layoutCardsStyle} ${layoutCardsStyle === 'list' ? 'rounded-0' : ''}${className ? ` ${className}` : ''}`}
        >
            {!readOnly && <a
                className="gn-resource-card-link"
                href={formatHref({
                    pathname: `/detail/${res.resource_type}/${res.pk}`
                })}
            />}
            <div className={`card-resource-${layoutCardsStyle}`}>
                <img
                    className={`${(layoutCardsStyle === 'list') ? 'card-img-left' : 'card-img-top'}`}
                    src={res.thumbnail_url}
                />
                <div className="card-body">
                    <div className="card-title">
                        {(icon && !loading) &&
                        <>
                            <ALink
                                readOnly={readOnly}
                                href={formatHref({
                                    query: {
                                        'filter{resource_type.in}': res.resource_type
                                    }
                                })}>
                                <FaIcon name={icon} />
                            </ALink>
                        </>}
                        {loading && <Spinner />}
                        <ALink readOnly={readOnly} href={formatHref({
                            pathname: `/detail/${res.resource_type}/${res.pk}`
                        })}>
                            {res.title}
                        </ALink>
                    </div>
                    {
                        (!res?.is_approved || !res?.is_published) &&
                        <p><ResourceStatus
                            isApproved={res?.is_approved}
                            isPublished={res?.is_published}/>
                        </p>
                    }
                    <p
                        className="card-text gn-card-description"
                    >
                        {res.raw_abstract ? res.raw_abstract : '...'}
                    </p>
                    <p
                        className="card-text gn-card-user"
                    >
                        <Message msgId="gnhome.author"/>: <ALink readOnly={readOnly} href={formatHref({
                            query: {
                                'filter{owner.username.in}': res.owner.username
                            }
                        })}>{getUserName(res.owner)}</ALink>
                    </p>

                </div>
                {(!readOnly && options && options.length > 0) && <Dropdown
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
                                if (opt.type === 'button' && actions[opt.action]) {
                                    return (
                                        <Dropdown.Item
                                            key={opt.action}
                                            onClick={() => onAction(actions[opt.action], [res])}
                                        >
                                            <FaIcon name={opt.icon} /> <Message msgId={opt.labelId}/>
                                        </Dropdown.Item>
                                    );
                                }

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
        </div>
    );
});

ResourceCard.defaultProps = {
    links: [],
    theme: 'light',
    getTypesInfo: getResourceTypesInfo,
    formatHref: () => '#'
};

export default ResourceCard;
