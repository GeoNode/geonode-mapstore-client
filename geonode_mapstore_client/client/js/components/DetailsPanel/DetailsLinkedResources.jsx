/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';

import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';

const DetailLinkedResource = ({resources, type}) => {
    return !isEmpty(resources) && (
        <div className="gn-details-info-fields">
            <Message msgId={`gnviewer.linkedResources.${type}`} />
            {resources.map((field, key) => {
                return (
                    <div key={key} className="gn-details-info-row gn-details-flex-field">
                        {field.icon && <FaIcon name={field.icon} />}
                        <a key={field.pk} href={field.detail_url}>
                            {field.title}
                        </a>
                    </div>
                );
            })}
        </div>
    );
};

const DetailsLinkedResources = ({ fields, resourceTypesInfo }) => {
    const linkedToFields = fields?.linkedTo?.map(resource=> ({...resource, icon: resourceTypesInfo[resource.resource_type]?.icon}));
    const linkedByFields = fields?.linkedBy?.map(resource=> ({...resource, icon: resourceTypesInfo[resource.resource_type]?.icon}));

    const linkedResources = [
        {
            resources: linkedToFields?.filter(resource => !resource.internal) ?? [],
            type: 'linkedTo'
        },
        {
            resources: linkedByFields?.filter(resource => !resource.internal) ?? [],
            type: 'linkedBy'
        },
        {
            resources: linkedToFields.filter(resource => resource.internal) ?? [],
            type: 'uses'
        },
        {
            resources: linkedByFields.filter(resource => resource.internal) ?? [],
            type: 'usedBy'
        }
    ];

    return (
        <div className="gn-details-linked-resources">
            {
                linkedResources.map(({resources, type})=> <DetailLinkedResource resources={resources} type={type}/>)
            }
        </div>
    );
};

DetailsLinkedResources.propTypes = {
    fields: PropTypes.array,
    resourceTypesInfo: PropTypes.object
};

DetailsLinkedResources.defaultProps = {
    fields: [],
    resourceTypesInfo: {}
};

export default DetailsLinkedResources;
