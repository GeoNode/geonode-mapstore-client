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
    cleanUrl,
    getDownloadUrlInfo,
    getResourceTypesInfo
} from '@js/utils/ResourceUtils';
import SharePageLink from '@js/plugins/share/SharePageLink';
import ShareEmbedLink from '@js/plugins/share/ShareEmbedLink';

const getEmbedUrl = (resource) => {
    const { formatEmbedUrl = (_resource) => _resource?.embed_url  } = getResourceTypesInfo()[resource?.resource_type] || {};
    return formatEmbedUrl(resource) ? resource?.embed_url : null;
};
function Share({
    enabled,
    onClose,
    resourceType,
    embedUrl,
    downloadUrl
}) {
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
                    <SharePageLink value={pageUrl} label={<Message msgId="gnviewer.thisPage" />} />
                    {embedUrl && <ShareEmbedLink embedUrl={embedUrl} label={<Message msgId={`gnviewer.embed${resourceType}`} />} />}
                    {(resourceType === 'document' && !!downloadUrl) && <SharePageLink value={downloadUrl} label={<Message msgId={`gnviewer.directLink`} />} />}
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
        getResourceData,
        getViewedResourceType
    ], (enabled, resource, type) => ({
        enabled,
        embedUrl: getEmbedUrl(resource),
        resourceType: type,
        downloadUrl: getDownloadUrlInfo(resource)?.url
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
