/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { getResourceData } from '@js/selectors/resource';
import { toggleControl, setControlProperty } from '@mapstore/framework/actions/controls';
import { formatResourceLinkUrl } from '@js/utils/ResourceUtils';
import Button from '@mapstore/framework/components/layout/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import SharePlugin from '@mapstore/framework/plugins/Share';

const ShareActionButton = connect(
    (state) => ({
        resource: getResourceData(state)
    }),
    {
        onToggleShare: toggleControl.bind(null, 'share', null),
        onSetShareResource: setControlProperty.bind(null, 'share', 'resource')
    }
)(({
    variant,
    size,
    className,
    disabled,
    resource,
    onToggleShare = () => {},
    onSetShareResource = () => {}
}) => {
    function handleShare(event) {
        if (event?.stopPropagation) {
            event.stopPropagation();
        }
        onSetShareResource({
            shareUrl: formatResourceLinkUrl(resource),
            categoryName: (resource?.category?.name || '').toLowerCase()
        });
        onToggleShare();
    }
    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            disabled={disabled}
            onClick={handleShare}
        >
            <Message msgId="share.title" />
        </Button>
    );
});

const { SharePlugin: Share, ...pluginParts } = SharePlugin;

// extend the MapStore Share plugin with the GeoNode ActionNavbar item
export default {
    ...pluginParts,
    SharePlugin: Object.assign(Share, {
        ActionNavbar: {
            name: 'ShareActionButton',
            Component: ShareActionButton,
            priority: 1,
            doNotHide: true
        }
    })
};
