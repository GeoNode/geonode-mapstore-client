/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import isEmpty from 'lodash/isEmpty';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { getDownloadUrlInfo, isDocumentExternalSource } from '@js/utils/ResourceUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import Dropdown from '@js/components/Dropdown';
import FaIcon from '@js/components/FaIcon';
import {
    getResourceData
} from '@js/selectors/resource';
import { downloadResource } from '@js/actions/gnresource';
import { processingDownload } from '@js/selectors/resourceservice';

const ButtonWithTooltip = tooltip(Button);

const RENDER_TYPE = {
    "button": ButtonWithTooltip,
    "menuItem": Dropdown.Item
};

const DownloadButton = ({
    resource,
    resourceData,
    variant,
    size,
    onAction = () => {},
    renderType = "button",
    showIcon,
    downloading
}) => {
    const Component =  RENDER_TYPE[renderType];
    const isButton = renderType !== "menuItem";
    const _resource = resource ?? resourceData;
    const downloadInfo = getDownloadUrlInfo(_resource);
    const isExternal = isDocumentExternalSource(_resource);
    const isNotAjaxSafe = !Boolean(downloadInfo?.ajaxSafe);

    if ((isEmpty(_resource?.download_urls) && !_resource?.perms?.includes('download_resourcebase'))
        || !_resource?.perms?.includes('download_resourcebase')
        || (!isButton && isNotAjaxSafe)
    ) {
        return null;
    }

    if (isNotAjaxSafe) {
        return (
            <Component
                {...isButton && { variant, size }}
                {...showIcon && { tooltipId: "gnviewer.download" }}
                download={`${_resource?.title}.${_resource?.extension}`}
                href={ downloadInfo.url }
                target="_blank"
                rel="noopener noreferrer"
            >
                {showIcon
                    ? <FaIcon name={isExternal ? "external-link" : "download"} />
                    : <Message msgId="gnviewer.download" />
                }
            </Component>
        );
    }

    return (
        <Component
            disabled={!!downloading}
            onClick={() => downloading ? null : onAction(_resource)}
            {...isButton && { variant, size}}
            {...showIcon && { tooltipId: "gnviewer.download" }}
        >
            {showIcon
                ? <FaIcon name="download" />
                : <Message msgId="gnviewer.download" />
            }
        </Component>
    );
};

const DownloadResource = connect(
    createSelector([
        getResourceData,
        processingDownload
    ], (resourceData, downloading) => ({
        resourceData,
        downloading
    })),
    {
        onAction: downloadResource
    }
)(DownloadButton);

/**
* @module DownloadResource
*/

/**
 * enable button or menu item to download a specific resource
 * @name DownloadResource
 * @example
 * {
 *  "name": "DownloadResource"
 * }
 */
export default createPlugin('DownloadResource', {
    component: DownloadResource,
    containers: {
        ActionNavbar: {
            name: 'DownloadResource',
            Component: DownloadResource,
            priority: 1
        },
        ResourcesGrid: {
            name: 'downloadResource',
            target: 'cardOptions',
            detailsToolbar: true,
            Component: DownloadResource,
            priority: 1
        },
        DetailViewer: {
            name: 'DownloadResource',
            target: 'toolbar',
            Component: DownloadResource,
            priority: 1
        }
    },
    epics: {},
    reducers: {}
});
