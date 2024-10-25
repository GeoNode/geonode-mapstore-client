/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { lazy, Suspense } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { withRouter } from 'react-router';
import isEqual from 'lodash/isEqual';
import MetadataUpdateButton from './containers/MetadataUpdateButton';
import {
    setMetadata,
    setInitialMetadata,
    setMetadataSchema,
    setMetadataUISchema,
    setMetadataLoading,
    setMetadataError,
    setMetadataUpdating,
    setMetadataUpdateError,
    setMetadataResource
} from './actions/metadata';
import { parseDevHostname } from '@js/utils/APIUtils';

import metadataReducer from './reducers/metadata';
import Button from '@js/components/Button';
import Message from '@mapstore/framework/components/I18N/Message';

const MetadataEditor = lazy(() => import('./containers/MetadataEditor'));

const connectMetadata = connect(
    createSelector([
        state => state?.metadata?.loading,
        state => state?.metadata?.error,
        state => state?.metadata?.metadata,
        state => state?.metadata?.initialMetadata,
        state => state?.metadata?.schema,
        state => state?.metadata?.uiSchema,
        state => state?.metadata?.updating,
        state => state?.metadata?.updateError,
        state => state?.metadata?.resource
    ], (loading, error, metadata, initialMetadata, schema, uiSchema, updating, updateError, resource) => ({
        loading,
        error,
        metadata,
        schema,
        uiSchema,
        updating,
        updateError,
        pendingChanges: !isEqual(initialMetadata, metadata),
        resource
    })),
    {
        setLoading: setMetadataLoading,
        setError: setMetadataError,
        setUISchema: setMetadataUISchema,
        setSchema: setMetadataSchema,
        setMetadata,
        setInitialMetadata,
        setUpdateError: setMetadataUpdateError,
        setUpdating: setMetadataUpdating,
        setResource: setMetadataResource
    }
);

const MetadataEditorComponent = ({ match,  ...props }) => {
    const { params } = match || {};
    const pk = params?.pk;
    return (
        <Suspense fallback={null}>
            <MetadataEditor {...props} pk={pk}/>
        </Suspense>
    );
};

const MetadataEditorPlugin = connectMetadata(withRouter(MetadataEditorComponent));

const UpdateButton = ({ match,  ...props }) => {
    const { params } = match || {};
    const pk = params?.pk;
    return (
        <MetadataUpdateButton {...props} pk={pk} />
    );
};

const UpdateButtonPlugin = connectMetadata(withRouter(UpdateButton));

const BackToButton = ({ size, variant, resource }) => {
    if (!resource) {
        return null;
    }
    return (<Button size={size} variant={variant} href={parseDevHostname(resource.detail_url || '')}>
        <Message msgId="gnviewer.goBackTo" msgParams={{ resourceName: resource.title }}/>
    </Button>);
};

const BackToButtonPlugin = connectMetadata(withRouter(BackToButton));

export default createPlugin('MetadataEditor', {
    component: MetadataEditorPlugin,
    containers: {
        ActionNavbar: [
            {
                name: 'MetadataEditor',
                Component: UpdateButtonPlugin
            },
            {
                name: 'MetadataEditorBackTo',
                Component: BackToButtonPlugin
            }
        ]
    },
    epics: {},
    reducers: {
        metadata: metadataReducer
    }
});
