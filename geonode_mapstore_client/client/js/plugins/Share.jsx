/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { findIndex } from 'lodash';
import { Glyphicon } from 'react-bootstrap';
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
    getResourceData,
    getViewedResourceType
} from '@js/selectors/resource';
import { updateResourceCompactPermissions } from '@js/actions/gnresource';
import Permissions from '@js/components/Permissions';
import { getUsers, getGroups, getResourceTypes } from '@js/api/geonode/v2';
import { resourceToPermissionEntry, availableResourceTypes, getResourcePermissions, cleanUrl } from '@js/utils/ResourceUtils';
import SharePageLink from '@js/plugins/share/SharePageLink';
import { getCurrentResourcePermissionsLoading } from '@js/selectors/resourceservice';

const entriesTabs = [
    {
        id: 'user',
        labelId: 'gnviewer.users',
        request: ({ entries, groups, ...params }) => {
            const exclude = entries.filter(({ type }) => type === 'user').map(({ id }) => id);
            return getUsers({
                ...params,
                'filter{-pk.in}': [...exclude, -1],
                'filter{is_superuser}': false
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
    resourceId,
    compactPermissions,
    layers,
    onChangePermissions,
    enableGeoLimits,
    onClose,
    canEdit,
    permissionsLoading,
    resourceType,
    embedUrl,
    downloadUrl
}) {

    const [permissionsObject, setPermissionsObject] = useState({});
    useEffect(() => {
        getResourceTypes().then((data) => {
            const resourceIndex = findIndex(data, { name: resourceType });
            let responseOptions;
            if (resourceIndex !== - 1) {
                responseOptions  = getResourcePermissions(data[resourceIndex].allowed_perms.compact);
            } else { // set a default permission object
                responseOptions = getResourcePermissions(data[0].allowed_perms.compact);
            }
            setPermissionsObject(responseOptions);
        });
    }, [availableResourceTypes]);

    const pageUrl = cleanUrl(window.location.href);


    return (
        <OverlayContainer
            enabled={enabled}
            className="gn-overlay-wrapper"
        >
            <section
                className="gn-share-panel"
            >
                <div className="gn-share-panel-head">
                    <h2><Message msgId="gnviewer.shareThisResource" /></h2>
                    <Button className="square-button" onClick={() => onClose()}>
                        <Glyphicon glyph="1-close" />
                    </Button>
                </div>
                <div className="gn-share-panel-body">
                    <SharePageLink url={pageUrl} label={<Message msgId="gnviewer.thisPage" />} />
                    <SharePageLink url={embedUrl} label={<Message msgId={`gnviewer.embed${resourceType}`} />} />
                    {(resourceType === 'document' && !!downloadUrl) && <SharePageLink url={downloadUrl} label={<Message msgId={`gnviewer.directLink`} />} />}
                    {canEdit && <>
                        <Permissions
                            compactPermissions={compactPermissions}
                            layers={layers} entriesTabs={entriesTabs}
                            onChange={onChangePermissions}
                            enableGeoLimits={enableGeoLimits}
                            resourceId={resourceId}
                            loading={permissionsLoading}
                            permissionOptions={permissionsObject}
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
    onClose: PropTypes.func
};

Share.defaultProps = {
    resourceId: null,
    enabled: false,
    onClose: () => {}
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
        getResourceData,
        getViewedResourceType
    ], (enabled, resourceId, mapInfo, compactPermissions, layers, canEdit, permissionsLoading, resource, type) => ({
        enabled,
        resourceId: resourceId || mapInfo?.id,
        compactPermissions,
        layers,
        canEdit,
        permissionsLoading,
        embedUrl: resource?.embed_url,
        resourceType: type,
        downloadUrl: resource?.download_url
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
        ActionNavbar: {
            name: 'Share',
            Component: ConnectedShareButton
        }
    },
    epics: {},
    reducers: {
        controls
    }
});
