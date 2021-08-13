/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import Message from '@mapstore/framework/components/I18N/Message';
import controls from '@mapstore/framework/reducers/controls';
import Button from '@js/components/Button';
import { mapInfoSelector } from '@mapstore/framework/selectors/map';
import { layersSelector } from '@mapstore/framework/selectors/layers';
import OverlayContainer from '@js/components/OverlayContainer';
import {
    isNewResource,
    getResourceId,
    getCompactPermissions,
    canEditPermissions,
    getResourceData
} from '@js/selectors/resource';
import { updateResourceCompactPermissions } from '@js/actions/gnresource';
import FaIcon from '@js/components/FaIcon/FaIcon';
import Permissions from '@js/components/Permissions';
import { getUsers, getGroups } from '@js/api/geonode/v2';
import { resourceToPermissionEntry } from '@js/utils/ResourceUtils';
import SharePageLink from '@js/plugins/share/SharePageLink';
import ShareEmbedLink from '@js/plugins/share/ShareEmbedLink';
import { getCurrentResourcePermissionsLoading } from '@js/selectors/resourceservice';

const entriesTabs = [
    {
        id: 'user',
        labelId: 'gnviewer.users',
        request: ({ entries, groups, ...params }) => {
            const exclude = entries.filter(({ type }) => type === 'user').map(({ id }) => id);
            return getUsers({
                ...params,
                'filter{-pk.in}': [...exclude, -1]
            });
        },
        responseToEntries: ({ response, entries }) => {
            return response?.users.map(user => {
                const { permissions } = entries.find(entry => entry.id === user.pk) || {};
                return {
                    ...resourceToPermissionEntry('user', user),
                    permissions
                };
            });
        }
    },
    {
        id: 'group',
        labelId: 'gnviewer.groups',
        request: ({ entries, groups, ...params }) => {
            const excludeEntries = entries.filter(({ type }) => type === 'group').map(({ id }) => id);
            const excludeGroups = groups.map(({ id }) => id);
            const exclude = [
                ...(excludeEntries || []),
                ...(excludeGroups || [])
            ];
            return getGroups({
                ...params,
                'filter{-group.pk.in}': exclude
            });
        },
        responseToEntries: ({ response, entries }) => {
            return response?.groups.map(group => {
                const { permissions } = entries.find(entry => entry.id === group.pk) || {};
                return {
                    ...resourceToPermissionEntry('group', group),
                    permissions
                };
            });
        }
    }
];
function Share({
    enabled,
    width,
    permissionsOptions,
    resourceId,
    compactPermissions,
    layers,
    onChangePermissions,
    enableGeoLimits,
    onClose,
    canEdit,
    permissionsGroupOptions,
    permissionsDefaultGroupOptions,
    permissionsLoading,
    embedUrl
}) {

    const shareUrl = embedUrl;

    return (
        <OverlayContainer
            enabled={enabled}
            style={{ width }}
        >
            <section
                className="gn-share-panel"
            >
                <div className="gn-share-panel-head">
                    <h2><Message msgId="gnviewer.shareThisResource" /></h2>
                    <Button size="sm" onClick={() => onClose()}>
                        <FaIcon name="times"/>
                    </Button>
                </div>
                <div className="gn-share-panel-body">
                    <SharePageLink />
                    <div className="gn-share-panel-label"><label><Message msgId="gnviewer.embed" />:</label></div>
                    <ShareEmbedLink
                        shareUrl={shareUrl}
                    />
                    {canEdit && <>
                        <div className="gn-share-panel-label"><label><Message msgId="gnviewer.permissions" />:</label></div>
                        <Permissions
                            compactPermissions={compactPermissions}
                            layers={layers} entriesTabs={entriesTabs}
                            onChange={onChangePermissions}
                            options={permissionsOptions}
                            enableGeoLimits={enableGeoLimits}
                            resourceId={resourceId}
                            groupOptions={permissionsGroupOptions}
                            defaultGroupOptions={permissionsDefaultGroupOptions}
                            loading={permissionsLoading}
                        />
                    </>}
                </div>
            </section>
        </OverlayContainer>
    );
}

Share.propTypes = {
    resourceId: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]),
    enabled: PropTypes.bool,
    onClose: PropTypes.func,
    width: PropTypes.number,
    permissionsOptions: PropTypes.array,
    defaultGroupOptions: PropTypes.array,
    groupOptions: PropTypes.array
};

Share.defaultProps = {
    resourceId: null,
    enabled: false,
    onClose: () => {},
    width: 800,
    permissionsGroupOptions: {
        'anonymous': [
            {
                value: 'none',
                labelId: 'gnviewer.permissionNone'
            },
            {
                value: 'view',
                labelId: 'gnviewer.permissionView'
            },
            {
                value: 'download',
                labelId: 'gnviewer.permissionDownload'
            }
        ]
    },
    permissionsOptions: [
        {
            value: 'view',
            labelId: 'gnviewer.permissionView'
        },
        {
            value: 'download',
            labelId: 'gnviewer.permissionDownload'
        },
        {
            value: 'edit',
            labelId: 'gnviewer.permissionEdit'
        },
        {
            value: 'manage',
            labelId: 'gnviewer.permissionManage'
        }
    ],
    permissionsDefaultGroupOptions: [
        {
            value: 'none',
            labelId: 'gnviewer.permissionNone'
        },
        {
            value: 'view',
            labelId: 'gnviewer.permissionView'
        },
        {
            value: 'download',
            labelId: 'gnviewer.permissionDownload'
        },
        {
            value: 'edit',
            labelId: 'gnviewer.permissionEdit'
        }
    ]
};

const SharePlugin = connect(
    createSelector([
        state => state?.controls?.rightOverlay?.enabled === 'Share',
        getResourceId,
        mapInfoSelector,
        getCompactPermissions,
        layersSelector,
        canEditPermissions,
        getCurrentResourcePermissionsLoading,
        getResourceData
    ], (enabled, resourceId, mapInfo, compactPermissions, layers, canEdit, permissionsLoading, resource) => ({
        enabled,
        resourceId: resourceId || mapInfo?.id,
        compactPermissions,
        layers,
        canEdit,
        permissionsLoading,
        embedUrl: resource?.embed_url
    })),
    {
        onClose: setControlProperty.bind(null, 'rightOverlay', 'enabled', false),
        onChangePermissions: updateResourceCompactPermissions
    }
)(Share);

function ShareButton({
    enabled,
    variant,
    onClick,
    size
}) {
    return enabled
        ? <Button
            variant={variant || "primary"}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="share.title"/>
        </Button>
        : null
    ;
}

const ConnectedShareButton = connect(
    createSelector(
        isNewResource,
        getResourceId,
        mapInfoSelector,
        (isNew, resourceId, mapInfo) => ({
            enabled: !isNew && (resourceId || mapInfo?.id)
        })
    ),
    {
        onClick: setControlProperty.bind(null, 'rightOverlay', 'enabled', 'Share')
    }
)((ShareButton));

export default createPlugin('Share', {
    component: SharePlugin,
    containers: {
        ViewerLayout: {
            name: 'Share',
            target: 'rightOverlay',
            priority: 1
        },
        ActionNavbar: {
            name: 'Share',
            Component: ConnectedShareButton,
            priority: 1
        }
    },
    epics: {},
    reducers: {
        controls
    }
});
