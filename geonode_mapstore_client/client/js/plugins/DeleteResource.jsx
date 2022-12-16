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
import Dropdown from '@js/components/Dropdown';
import FaIcon from '@js/components/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import ResizableModal from '@mapstore/framework/components/misc/ResizableModal';
import Portal from '@mapstore/framework/components/misc/Portal';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { getResourceData } from '@js/selectors/resource';
import { processResources } from '@js/actions/gnresource';
import ResourceCard from '@js/components/ResourceCard';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import Loader from '@mapstore/framework/components/misc/Loader';
import controls from '@mapstore/framework/reducers/controls';
import { isLoggedIn } from '@mapstore/framework/selectors/security';
import { hashLocationToHref } from '@js/utils/SearchUtils';

const simulateAClick = (href) => {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.click();
};

function DeleteResourcePlugin({
    enabled,
    resources = [],
    onClose = () => {},
    onDelete = () => {},
    redirectTo = '/',
    loading,
    location,
    selectedResource
}) {
    return (
        <Portal>
            <ResizableModal
                title={<Message msgId="gnviewer.deleteResourceTitle" msgParams={{ count: resources.length }}/>}
                show={enabled}
                fitContent
                clickOutEnabled={false}
                modalClassName="gn-simple-dialog"
                buttons={loading
                    ? []
                    : [{
                        text: <Message msgId="gnviewer.deleteResourceNo" msgParams={{ count: resources.length }} />,
                        onClick: () => onClose()
                    },
                    {
                        text: <Message msgId="gnviewer.deleteResourceYes" msgParams={{ count: resources.length }} />,
                        bsStyle: 'danger',
                        onClick: () => {
                            const resourcesPk = resources.map(({ pk }) => pk);
                            if (!redirectTo && selectedResource?.pk && resourcesPk.includes(selectedResource.pk)) {
                                // this is needed to close the panel
                                simulateAClick(hashLocationToHref({
                                    location,
                                    excludeQueryKeys: ['d']
                                }));
                            }
                            onDelete(resources, redirectTo);
                        }
                    }]
                }
                onClose={loading ? null : () => onClose()}
            >
                <ul
                    className="gn-card-grid"
                    style={{
                        listStyleType: 'none',
                        padding: '0.5rem',
                        margin: 0
                    }}
                >
                    {resources.map((data, idx) => {
                        return (
                            <li style={{ padding: '0.25rem 0' }} key={data.pk + '-' + idx}>
                                <ResourceCard data={data} layoutCardsStyle="list" readOnly/>
                            </li>
                        );
                    })}
                </ul>
                {loading && <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Loader size={70}/>
                </div>}
            </ResizableModal>
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
    onDelete
}) {

    if (!(authenticated && resource?.perms?.includes('delete_resourcebase'))) {
        return null;
    }

    return (
        <Dropdown.Item
            onClick={() =>
                onDelete([resource])
            }
        >
            <FaIcon name="trash" />{' '}
            <Message msgId="gnhome.delete" />
        </Dropdown.Item>
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
            target: 'cardOptions',
            Component: ConnectedMenuItem
        }
    },
    epics: {},
    reducers: {
        controls
    }
});
