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
import { Glyphicon } from 'react-bootstrap';

import Message from '@mapstore/framework/components/I18N/Message';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import { parseCatalogResource } from '@js/utils/ResourceUtils';

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
                        {icon && <Glyphicon {...icon} />}
                        <a key={field.pk} href={field.detail_url}>
                            {field.title}
                        </a>
                    </FlexBox>
                );
            })}
        </FlexBox>
    );
};

// message ids of each relation type, for the linked_to and linked_by directions
const relations = [
    { relationType: 'related', linkedTo: 'linkedTo', linkedBy: 'linkedBy' },
    { relationType: 'uses', linkedTo: 'uses', linkedBy: 'usedBy' },
    { relationType: 'clone_of', linkedTo: 'cloneOf', linkedBy: 'clonedBy' }
];

const getRelationType = ({ relation_type: relationType, internal }) => {
    // older backends only return the internal flag
    const type = relationType ?? (internal ? 'uses' : 'related');
    return relations.some((relation) => relation.relationType === type) ? type : 'related';
};

const DetailsLinkedResources = ({ fields }) => {

    const linkedToFields = (fields?.linkedTo ?? []).map(parseCatalogResource);
    const linkedByFields = (fields?.linkedBy ?? []).map(parseCatalogResource);

    const linkedResources = relations.reduce((acc, { relationType, linkedTo, linkedBy }) => [
        ...acc,
        {
            resources: linkedToFields.filter(resource => getRelationType(resource) === relationType),
            type: linkedTo
        },
        {
            resources: linkedByFields.filter(resource => getRelationType(resource) === relationType),
            type: linkedBy
        }
    ], []);

    return (
        <FlexBox column gap="xs" className="gn-details-relations _padding-tb-md">
            {linkedResources.map(({resources, type})=> <DetailLinkedResource key={type} resources={resources} type={type}/>)}
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
