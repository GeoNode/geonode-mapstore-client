/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { forwardRef, useState } from 'react';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Spinner from '@js/components/Spinner';
import { getResourceTypesInfo, getMetadataDetailUrl } from '@js/utils/ResourceUtils';
import ResourceStatus from '@js/components/ResourceStatus';
import ALink from '@js/components/ALink';
import AuthorInfo from '@js/components/AuthorInfo/AuthorInfo';
import ActionButtons from '@js/components/ActionButtons';


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
    loading,
    featured,
    onClick
}, ref) => {
    const res = data;
    const types = getTypesInfo();
    const { icon } = types[res.subtype] || types[res.resource_type] || {};
    const {
        formatDetailUrl = resource => resource?.detail_url,
        canPreviewed
    } = res && (types[res.subtype] || types[res.resource_type]) || {};
    const detailUrl = res?.pk && formatDetailUrl(res);
    const resourceCanPreviewed = res?.pk && canPreviewed && canPreviewed(res);
    const metadataDetailUrl = res?.pk && getMetadataDetailUrl(res);

    const [imgError, setImgError] = useState(false);

    function handleClick() {
        onClick(data);
    }
    const imgClassName = layoutCardsStyle === 'list' ? 'card-img-left' : 'card-img-top';
    return (
        <div
            ref={ref}
            onClick={handleClick}
            className={`gn-resource-card${active ? ' active' : ''}${
                readOnly ? ' read-only' : ''
            } gn-card-type-${layoutCardsStyle} ${
                layoutCardsStyle === 'list' ? 'rounded-0' : ''
            }${className ? ` ${className}` : ''}`}
        >
            {!readOnly && (
                <a
                    className="gn-resource-card-link"
                    href={formatHref({
                        pathname: `/detail/${res.resource_type}/${res.pk}`
                    })}
                />
            )}
            {!readOnly &&
                options &&
                options.length > 0 &&
                layoutCardsStyle === 'grid' && (
                <ActionButtons
                    buildHrefByTemplate={buildHrefByTemplate}
                    actions={actions}
                    resource={res}
                    options={options}
                    readOnly={readOnly}
                    onAction={onAction}
                />
            )}
            <div className={`card-resource-${layoutCardsStyle}`}>
                {imgError ? (
                    <div className={`${imgClassName} card-img-placeholder`} />
                ) : (
                    <img
                        className={imgClassName}
                        src={res.thumbnail_url}
                        onError={() => setImgError(true)}
                    />
                )}
                <div className="gn-resource-card-body-wrapper">
                    <div className="card-body">
                        <div className="card-title">
                            <div>
                                {icon && !loading && (
                                    <>
                                        <ALink
                                            readOnly={readOnly}
                                            href={formatHref({
                                                query: {
                                                    'filter{resource_type.in}':
                                                    res.resource_type
                                                }
                                            })}
                                        >
                                            <FaIcon name={icon} />
                                        </ALink>
                                    </>
                                )}
                                {loading && <Spinner />}
                                <ALink
                                    className={
                                        featured
                                            ? 'gn-featured-card-title'
                                            : 'gn-card-title'
                                    }
                                    readOnly={readOnly}
                                    href={formatHref({
                                        pathname: `/detail/${res.resource_type}/${res.pk}`
                                    })}
                                >
                                    {res.title}
                                </ALink>
                            </div>
                            <div>
                                <ResourceStatus resource={res} />
                            </div>
                        </div>
                        <p className="card-text gn-card-description">
                            {res.raw_abstract ? res.raw_abstract : '...'}
                        </p>
                        {!readOnly &&
                            options &&
                            options.length > 0 &&
                            layoutCardsStyle === 'list' && (
                            <ActionButtons
                                buildHrefByTemplate={buildHrefByTemplate}
                                actions={actions}
                                resource={res}
                                options={options}
                                readOnly={readOnly}
                                onAction={onAction}
                            />
                        )}
                    </div>
                    <div className="gn-footer-wrapper">
                        <div
                            className="gn-card-footer"
                            style={{
                                padding:
                                    options && options.length === 0
                                        ? '0 0.25rem 0 0.5rem'
                                        : '0 0.5rem'
                            }}
                        >
                            <AuthorInfo
                                resource={res}
                                readOnly={readOnly}
                                formatHref={formatHref}
                            />
                            <div className="gn-card-actions">
                                {!readOnly && (detailUrl || metadataDetailUrl) && (
                                    <div
                                        className={`${
                                            options && options.length === 0
                                                ? 'gn-card-view-editor-right'
                                                : 'gn-card-view-editor'
                                        }`}
                                    >
                                        <Button
                                            variant="primary"
                                            href={
                                                resourceCanPreviewed
                                                    ? detailUrl
                                                    : metadataDetailUrl
                                            }
                                            rel="noopener noreferrer"
                                        >
                                            <Message msgId={`gnhome.view`} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ResourceCard.defaultProps = {
    links: [],
    theme: 'light',
    getTypesInfo: getResourceTypesInfo,
    formatHref: () => '#',
    featured: false,
    onClick: () => {}
};

export default ResourceCard;
