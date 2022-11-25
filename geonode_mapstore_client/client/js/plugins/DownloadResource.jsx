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
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import Dropdown from '@js/components/Dropdown';
import FaIcon from '@js/components/FaIcon';
import {
    getResourceData
} from '@js/selectors/resource';
import { downloadResource } from '@js/actions/gnresource';

function DownloadDocumentButton({
    resource,
    variant,
    size
}) {
    return (
        resource ? <Button
            download={`${resource?.title}.${resource?.extension}`}
            href={resource?.href}
            variant={variant}
            size={size}
        >
            <Message msgId="gnviewer.download" />
        </Button> : null);
}

const ConnectedDownloadResource = connect(
    createSelector([
        getResourceData
    ], (resource) => ({
        resource
    })),
    {
    }
)(DownloadDocumentButton);

function DownloadMenuItem({
    resource,
    onDownload
}) {

    if (!(resource?.download_url && resource?.perms?.includes('download_resourcebase'))) {
        return null;
    }

    return (
        <Dropdown.Item
            onClick={() =>
                onDownload(resource)
            }
        >
            <FaIcon name="download" />{' '}
            <Message msgId="gnviewer.download" />
        </Dropdown.Item>
    );
}

const ConnectedMenuItem = connect(
    createSelector([], () => ({})),
    {
        onDownload: downloadResource
    }
)((DownloadMenuItem));

export default createPlugin('DownloadResource', {
    component: ConnectedDownloadResource,
    containers: {
        ActionNavbar: {
            name: 'DownloadResource',
            Component: ConnectedDownloadResource,
            priority: 1
        },
        ResourcesGrid: {
            name: 'downloadResource',
            target: 'cardOptions',
            Component: ConnectedMenuItem,
            priority: 1
        }
    },
    epics: {},
    reducers: {}
});
