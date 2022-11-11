/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import FaIcon from '@js/components/FaIcon';
import NavLink from '@js/components/Menu/NavLink';

function BreadCrumb({ resource, titleItems }) {

    return (
        <div className="gn-action-navbar-title">
            <div>
                <NavLink href={`/catalogue/#/search/?f=${resource?.resource_type}`} className="gn-action-navbar-breadcrumb-link">
                    <FaIcon name="home" />
                </NavLink>
                <FaIcon
                    name="angle-right"
                    className="gn-action-navbar-breadcrumb-seperator"
                />
                <p
                    title={resource?.title}
                    className="gn-action-navbar-resource-title"
                >
                    {resource?.title}
                </p>
            </div>
            {titleItems.map(({ Component, name }) => (
                <Component key={name} variant="info" />
            ))}
        </div>
    );
}

BreadCrumb.propTypes = {
    resource: PropTypes.object,
    titleItems: PropTypes.array
};

BreadCrumb.defaultProps = {
    resource: {},
    titleItems: []
};

export default BreadCrumb;
