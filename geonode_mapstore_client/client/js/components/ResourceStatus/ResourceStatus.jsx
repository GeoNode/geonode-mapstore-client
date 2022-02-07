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
import FaIcon from '@js/components/FaIcon';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import isEmpty from 'lodash/isEmpty';
import { getResourceStatuses } from '@js/utils/ResourceUtils';
import Button from '@js/components/Button';

const ButtonWithTooltip = tooltip(Button);

const ResourceStatus = ({ resource = {} }) => {
    const {
        isApproved,
        isPublished,
        isProcessing,
        isCopying,
        isDeleting,
        isDeleted
    } = getResourceStatuses(resource);

    const getTitle = (status) => {
        const { isApproved: approved, isPublished: published } = status;

        if (!approved && published) {
            return <Message msgId="gnhome.pendingApproval" />;
        }
        if (!approved && !published) {
            return <Message msgId="gnhome.unApprovedunPublished" />;
        }
        if (!published && !approved) {
            return <Message msgId="gnhome.unpublished" />;
        }

        return '';
    };

    return !isEmpty(resource)
        ? (
            <p className="gn-resource-status-text">
                {
                    (!isProcessing && (!isApproved || !isPublished)) &&
                        <ButtonWithTooltip variant="default" className="gn-resource-status gn-status-button" tooltip={getTitle({ isApproved, isPublished })} style={{ marginRight: (isDeleting || isDeleted || isCopying) && '0.4rem' }} tooltipPosition="top">
                            <FaIcon  name="info-circle" className="gn-resource-status-pending" />
                        </ButtonWithTooltip>
                }
                {isDeleting && <span className="gn-resource-status gn-resource-status-danger" >
                    <Message msgId="gnviewer.deleting" />
                </span>}
                {isDeleted && <span className="gn-resource-status gn-resource-status-danger" >
                    <Message msgId="gnviewer.deleted" />
                </span>}
                {isCopying && <span className="gn-resource-status gn-resource-status-primary" >
                    <Message msgId="gnviewer.cloning" />
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
