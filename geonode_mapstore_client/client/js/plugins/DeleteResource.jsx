/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import ConfirmDialog from '@mapstore/framework/components/layout/ConfirmDialog';
import Portal from '@mapstore/framework/components/misc/Portal';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { getResourceData } from '@js/selectors/resource';
import { processResources } from '@js/actions/gnresource';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import controls from '@mapstore/framework/reducers/controls';
import { isLoggedIn } from '@mapstore/framework/selectors/security';
import { hashLocationToHref } from '@js/utils/SearchUtils';
import { ResourceTypes } from '@js/utils/ResourceUtils';

const simulateAClick = (href) => {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.click();
};

const linkableResources = [ResourceTypes.VIEWER]; // dataset will be added in the future

const WarningLinkedResource = ({resources = []}) => {
    const isLinkableResource = resources.some(res => linkableResources.includes(res.resource_type));
    if (isLinkableResource) {
        const [{resource_type: resourceType}] = resources;
        return (
            <div className="gn-resource-delete-warning">
                <Icon className="warning" glyph="warning"/> &nbsp;
                <Message msgId={`gnviewer.deleteResourceWarning.${resourceType}`}/>
            </div>
        );
    }
    return null;
};

/**
* @module DeleteResource
*/

/**
 * enable button or menu item to delete a specific resource
 * @name DeleteResource
 * @prop {string|boolean} redirectTo path to redirect after delete, if false will not redirect
 * @example
 * {
 *  "name": "DeleteResource",
 *  "cfg": {
 *      "redirectTo": false
 *  }
 * }
 */
function DeleteResourcePlugin({
    enabled,
    resources = [],
    onClose = () => {},
    onDelete = () => {},
    redirectTo,
    loading,
    location,
    selectedResource
}) {
    return (
        <Portal>
            <ConfirmDialog
                show={enabled}
                titleId="gnviewer.deleteResourceTitle"
                titleParams={{ count: resources.length }}
                cancelId="gnviewer.deleteResourceNo"
                cancelParams={{ count: resources.length }}
                confirmId="gnviewer.deleteResourceYes"
                confirmParams={{ count: resources.length }}
                variant="danger"
                loading={loading}
                onCancel={() => {
                    onClose();
                }}
                onConfirm={() => {
                    const resourcesPk = resources.map(({ pk }) => pk);
                    if (!redirectTo && selectedResource?.pk && resourcesPk.includes(selectedResource.pk)) {
                        // this is needed to close the panel
                        // TODO: use action to close panel
                        simulateAClick(hashLocationToHref({
                            location,
                            excludeQueryKeys: ['d']
                        }));
                    }
                    onDelete(resources, redirectTo);
                }}
            >
                <WarningLinkedResource resources={resources}/>
            </ConfirmDialog>
        </Portal>
    );
}

const ConnectedDeleteResourcePlugin = connect(
    createSelector([
        state => state?.controls?.[ProcessTypes.DELETE_RESOURCE]?.value,
        state => state?.controls?.[ProcessTypes.DELETE_RESOURCE]?.loading,
        state => state?.router?.location,
        getResourceData
    ], (resources, loading, location, selectedResource) => ({
        resources,
        enabled: !!resources,
        loading,
        location,
        selectedResource
    })), {
        onClose: setControlProperty.bind(null, ProcessTypes.DELETE_RESOURCE, 'value', undefined),
        onDelete: processResources.bind(null, ProcessTypes.DELETE_RESOURCE)
    }
)(DeleteResourcePlugin);

const DeleteButton = ({
    onClick,
    size,
    resource
}) => {

    const handleClickButton = () => {
        onClick([resource]);
    };

    return (
        <Button
            variant="danger"
            size={size}
            onClick={handleClickButton}
        >
            <Message msgId="gnhome.delete"/>
        </Button>
    );
};

const ConnectedDeleteButton = connect(
    createSelector([
        getResourceData
    ], (resource) => ({
        resource
    })),
    {
        onClick: setControlProperty.bind(null, ProcessTypes.DELETE_RESOURCE, 'value')
    }
)((DeleteButton));

function DeleteMenuItem({
    resource,
    authenticated,
    onDelete,
    component
}) {

    if (!(authenticated && resource?.perms?.includes('delete_resourcebase'))) {
        return null;
    }
    const Component = component;
    return (
        <Component
            onClick={() =>
                onDelete([resource])
            }
            glyph="trash"
            iconType="glyphicon"
            labelId="gnhome.delete"
        />
    );
}

const ConnectedMenuItem = connect(
    createSelector([isLoggedIn], (authenticated) => ({ authenticated })),
    {
        onDelete: setControlProperty.bind(null, ProcessTypes.DELETE_RESOURCE, 'value')
    }
)((DeleteMenuItem));

export default createPlugin('DeleteResource', {
    component: ConnectedDeleteResourcePlugin,
    containers: {
        ActionNavbar: {
            name: 'DeleteResource',
            Component: ConnectedDeleteButton
        },
        ResourcesGrid: {
            name: ProcessTypes.DELETE_RESOURCE,
            target: 'card-options',
            Component: ConnectedMenuItem
        }
    },
    epics: {},
    reducers: {
        controls
    }
});
