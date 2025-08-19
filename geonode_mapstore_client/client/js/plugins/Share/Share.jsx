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
import { Glyphicon } from 'react-bootstrap';

import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import Message from '@mapstore/framework/components/I18N/Message';
import controls from '@mapstore/framework/reducers/controls';
import Button from '@mapstore/framework/components/layout/Button';
import { mapInfoSelector } from '@mapstore/framework/selectors/map';

import OverlayContainer from '@js/components/OverlayContainer';
import {
    isNewResource,
    getResourceId,
    getResourceData,
    getViewedResourceType
} from '@js/selectors/resource';
import {
    canAccessPermissions,
    getDownloadUrlInfo,
    getResourceTypesInfo
} from '@js/utils/ResourceUtils';
import SharePageLink from '@js/plugins/Share/SharePageLink';
import ShareEmbedLink from '@js/plugins/Share/ShareEmbedLink';
import Permissions from '@js/plugins/Share/components/Permissions';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';

const getEmbedUrl = (resource) => {
    const { formatEmbedUrl = (_resource) => _resource?.embed_url  } = getResourceTypesInfo()[resource?.resource_type] || {};
    return formatEmbedUrl(resource) ? resource?.embed_url : null;
};
function Share({
    enabled,
    onClose,
    resource,
    resourceType
}) {
    const embedUrl = getEmbedUrl(resource);
    const downloadUrl = getDownloadUrlInfo(resource)?.url;
    return (
        <OverlayContainer
            enabled={enabled}
            className="gn-overlay-wrapper"
        >
            <section className="gn-share-panel">
                <div className="gn-share-panel-head">
                    <h2><Message msgId="gnviewer.shareThisResource" /></h2>
                    <Button className="square-button gn-share-panel-close" onClick={() => onClose()}>
                        <Glyphicon glyph="1-close" />
                    </Button>
                </div>
                <FlexBox column gap="md" className="gn-share-panel-body">
                    {canAccessPermissions(resource) && <Permissions resource={resource} />}
                    {(resourceType === 'document' && !!downloadUrl) && <SharePageLink value={downloadUrl} label={<Message msgId={`gnviewer.directLink`} />} collapsible={false} />}
                    {embedUrl && <ShareEmbedLink embedUrl={embedUrl} label={<Message msgId={`gnviewer.embed${resourceType}`} />} />}
                </FlexBox>
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
        getResourceData,
        getViewedResourceType
    ], (enabled, resource, type) => ({
        enabled,
        resource,
        resourceType: type
    })),
    {
        onClose: setControlProperty.bind(null, 'rightOverlay', 'enabled', false)
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
