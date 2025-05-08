
/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import { createSelector } from 'reselect';

import Button from '@mapstore/framework/components/layout/Button';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { manageLinkedResource, processResources } from '@js/actions/gnresource';
import Message from '@mapstore/framework/components/I18N/Message';
import Loader from '@mapstore/framework/components/misc/Loader';
import { ResourceTypes } from '@js/utils/ResourceUtils';
import Portal from '@mapstore/framework/components/misc/Portal';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import { getResourceData } from '@js/selectors/resource';
import ConfirmDialog from '@mapstore/framework/components/layout/ConfirmDialog';

const WarningLinkedResource = ({resourceType} = {}) => {
    if (resourceType) {
        return (
            <div className="gn-resource-delete-warning">
                <Icon className="warning" glyph="warning"/> &nbsp;
                <Message msgId={`gnviewer.linkedResource.deleteAndUnlinkWarning.${resourceType}`}/>
            </div>
        );
    }
    return null;
};

function MapViewerConfigurationPlugin({
    enabled,
    resources = [],
    onClose = () => {},
    onDelete = () => {},
    onRemove = () => {},
    loading,
    resourceType,
    source
}) {
    const removeLinkedResource = () => {
        const target = resources.map(res => res?.pk);
        if (!isEmpty(source) && !isEmpty(target) && resourceType) {
            onRemove({
                resourceType,
                source,
                target,
                processType: ProcessTypes.REMOVE_LINKED_RESOURCE
            });
        }
    };

    const onClosePanel = () => {
        removeLinkedResource();
        onClose();
    };

    const onRemoveLinkedResource = () => {
        removeLinkedResource();
        onDelete(resources);
    };

    return (
        <Portal>
            <ConfirmDialog
                show={enabled}
                titleId="gnviewer.linkedResource.deleteTitle"
                titleParams={{ count: resources.length }}
                cancelId="gnviewer.deleteResourceNo"
                cancelParams={{ count: resources.length }}
                confirmId="gnviewer.deleteResourceYes"
                confirmParams={{ count: resources.length }}
                variant="danger"
                loading={loading}
                preventHide={false}
                onHide={() => {
                    onClose();
                }}
                onCancel={() => {
                    onClosePanel();
                }}
                onConfirm={() => {
                    onRemoveLinkedResource();
                }}
            >
                <WarningLinkedResource resourceType={resourceType}/>
            </ConfirmDialog>
        </Portal>
    );
}

const ConnectedRemoveLinkedResource = connect(
    createSelector([
        state => state?.controls?.[ProcessTypes.REMOVE_LINKED_RESOURCE]?.value,
        state => state?.controls?.[ProcessTypes.REMOVE_LINKED_RESOURCE]?.loading,
        getResourceData
    ], (value, loading, selectedResource) => ({
        resources: value?.resources ?? [],
        resourceType: value?.resourceType,
        enabled: !isEmpty(value?.resources),
        loading,
        source: selectedResource?.pk
    })),
    {
        onRemove: manageLinkedResource,
        onDelete: processResources.bind(null, ProcessTypes.REMOVE_LINKED_RESOURCE),
        onClose: setControlProperty.bind(null, ProcessTypes.REMOVE_LINKED_RESOURCE, 'value', undefined)
    }
)(MapViewerConfigurationPlugin);

const ButtonLinkedResource = ({  hide, loading, labelId, showLoader, ...props}) => {
    return !hide ? (
        <Button
            {...props}
            disabled={loading}
            style={{display: "flex", alignItems: "center", gap: 10}}
        >
            <Message msgId={labelId ?? 'gnviewer.linkedResource.remove'}/>
            {loading && showLoader && <Loader size={12}/>}
        </Button>
    ) : null;
};

const RemoveMapViewerButton = (props) => {
    const resourceType = ResourceTypes.VIEWER;
    const { linkedResources, ...mapViewerResource } = props.viewerLinkedResource ?? {};

    // when map viewer has one association
    const allowDelete = linkedResources?.linkedBy?.length === 1;

    const handleOnClick = () => {
        if (allowDelete) {
            props.onDelete({resources: [mapViewerResource], resourceType});
        } else {
            const sourcePk = props.resource?.pk;
            const targetPk = mapViewerResource?.pk;
            if (!isEmpty(sourcePk) && !isEmpty(targetPk) && resourceType) {
                props.onRemove({
                    resourceType,
                    source: sourcePk,
                    target: targetPk,
                    processType: ProcessTypes.REMOVE_LINKED_RESOURCE
                });
            }
        }
    };
    return (
        <ButtonLinkedResource
            {...props}
            showLoader={!allowDelete}
            onClick={handleOnClick}
            labelId={'gnviewer.removeViewerConfiguration'}
        />
    );
};

const RemoveMapViewerConfiguration = connect(
    (state) => ({
        loading: state?.controls?.[ProcessTypes.REMOVE_LINKED_RESOURCE]?.loading,
        viewerLinkedResource: state?.gnresource?.viewerLinkedResource,
        resource: state?.gnresource?.data
    }),
    {
        onRemove: manageLinkedResource,
        onDelete: setControlProperty.bind(null, ProcessTypes.REMOVE_LINKED_RESOURCE, 'value')
    }
)(RemoveMapViewerButton);

const EditMapViewer = (props) => {
    return (
        <ButtonLinkedResource
            {...props}
            href={'#/viewer/' + props.resourceParams?.appPk + '/map/' + props.resource?.pk}
            labelId={'gnviewer.editViewerConfiguration'}
        />
    );
};
const EditMapViewerConfiguration = connect(
    (state) => ({
        loading: state?.controls?.[ProcessTypes.REMOVE_LINKED_RESOURCE]?.loading,
        resourceParams: state?.gnresource?.params,
        resource: state?.gnresource?.data
    }),
    {}
)(EditMapViewer);

export default createPlugin('MapViewerConfiguration', {
    component: ConnectedRemoveLinkedResource,
    containers: {
        ActionNavbar: [{
            name: 'RemoveMapViewer',
            Component: RemoveMapViewerConfiguration
        },
        {
            name: 'EditMapViewer',
            Component: EditMapViewerConfiguration
        }]
    },
    epics: {},
    reducers: {}
});
