/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { withRouter } from 'react-router';
import isEqual from 'lodash/isEqual';
import Message from '@mapstore/framework/components/I18N/Message';
import ResizableModal from '@mapstore/framework/components/misc/ResizableModal';
import Portal from '@mapstore/framework/components/misc/Portal';
import Button from '@mapstore/framework/components/layout/Button';

import {
    setMetadataPreview
} from './actions/metadata';

import metadataReducer from './reducers/metadata';

const connectMetadataViewer = connect(
    createSelector([
        state => state?.metadata?.metadata,
        state => state?.metadata?.initialMetadata,
        state => state?.metadata?.preview
    ], (metadata, initialMetadata, preview) => ({
        preview,
        pendingChanges: !isEqual(initialMetadata, metadata)
    })),
    {
        setPreview: setMetadataPreview
    }
);

const MetadataViewer = ({
    match,
    preview,
    setPreview,
    labelId = 'gnviewer.viewMetadata'
}) => {
    const { params } = match || {};
    const pk = params?.pk;
    return (
        <Portal>
            <ResizableModal
                title={<Message msgId={labelId} />}
                show={preview}
                size="lg"
                clickOutEnabled={false}
                modalClassName="gn-simple-dialog"
                onClose={() => setPreview(false)}
            >
                <iframe style={{ border: 'none', position: 'absolute', width: '100%', height: '100%' }} src={`/metadata/${pk}/embed`} />
            </ResizableModal>
        </Portal>
    );
};

const MetadataViewerPlugin = connectMetadataViewer(withRouter(MetadataViewer));

const PreviewButton = ({
    size,
    variant,
    pendingChanges,
    setPreview = () => {},
    labelId = 'gnviewer.viewMetadata'
}) => {
    return (
        <Button
            size={size}
            variant={variant}
            disabled={pendingChanges}
            onClick={() => setPreview(true)}
        >
            <Message msgId={labelId} />
        </Button>
    );
};

const PreviewButtonPlugin = connectMetadataViewer(PreviewButton);

export default createPlugin('MetadataViewer', {
    component: MetadataViewerPlugin,
    containers: {
        ActionNavbar: {
            name: 'MetadataViewer',
            Component: PreviewButtonPlugin
        }
    },
    epics: {},
    reducers: {
        metadata: metadataReducer
    }
});
