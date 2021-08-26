/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import Message from '@mapstore/framework/components/I18N/Message';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { getResourceStatuses } from '@js/utils/ResourceUtils';

const ResourceStatus = ({ resource = {} }) => {
    const {
        isApproved,
        isPublished,
        isProcessing,
        isCopying,
        isDeleting,
        isDeleted
    } = getResourceStatuses(resource);
    return !isEmpty(resource)
        ? (
            <p>
                {(!isProcessing && !isApproved) && <span className={'gn-resource-status gn-resource-status-warning'} >
                    <Message msgId={'gnviewer.underApproval'} />
                </span>}
                {(!isProcessing && !isPublished) && <span className={'gn-resource-status gn-resource-status-danger'} >
                    <Message msgId={'gnviewer.unpublish'} />
                </span>}
                {isDeleting && <span className={'gn-resource-status gn-resource-status-danger'} >
                    <Message msgId={'gnviewer.deleting'} />
                </span>}
                {isDeleted && <span className={'gn-resource-status gn-resource-status-danger'} >
                    <Message msgId={'gnviewer.deleted'} />
                </span>}
                {isCopying && <span className={'gn-resource-status gn-resource-status-primary'} >
                    <Message msgId={'gnviewer.cloning'} />
                </span>}
            </p>
        )
        : null;
};

ResourceStatus.propTypes = {
    isApproved: PropTypes.bool,
    isPublished: PropTypes.bool
};

ResourceStatus.defaultProps = {
    isApproved: true,
    isPublished: true
};


export default ResourceStatus;
