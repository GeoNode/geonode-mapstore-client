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
import Message from '@mapstore/framework/components/I18N/Message';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import { parseCatalogResource } from '@js/utils/ResourceUtils';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';

const DetailLinkedResource = ({resources, type}) => {
    return !isEmpty(resources) && (
        <FlexBox column gap="xs">
            <Text fontSize="sm">
                <Message msgId={`gnviewer.linkedResources.${type}`} />
            </Text>
            {resources.map((field, key) => {
                const icon = field?.['@extras']?.info?.icon;
                return (
                    <FlexBox key={key} component={Text} centerChildrenVertically gap="sm" fontSize="sm" className="_row _padding-b-xs">
                        {icon && <Icon {...icon} />}
                        <a key={field.pk} href={field.detail_url}>
                            {field.title}
                        </a>
                    </FlexBox>
                );
            })}
        </FlexBox>
    );
};

const DetailsLinkedResources = ({ fields }) => {

    const linkedToFields = fields?.linkedTo?.map(parseCatalogResource);
    const linkedByFields = fields?.linkedBy?.map(parseCatalogResource);

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
        <FlexBox column gap="xs" className="gn-details-linked-resources _padding-tb-md">
            {linkedResources.map(({resources, type})=> <DetailLinkedResource resources={resources} type={type}/>)}
        </FlexBox>
    );
};

DetailsLinkedResources.propTypes = {
    fields: PropTypes.array
};

DetailsLinkedResources.defaultProps = {
    fields: []
};

export default DetailsLinkedResources;
