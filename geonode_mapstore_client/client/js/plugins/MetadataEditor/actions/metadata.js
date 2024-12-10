/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const SET_METADATA = 'GEONODE:SET_METADATA';
export const SET_INITIAL_METADATA = 'GEONODE:SET_INITIAL_METADATA';
export const SET_METADATA_SCHEMA = 'GEONODE:SET_METADATA_SCHEMA';
export const SET_METADATA_UI_SCHEMA = 'GEONODE:SET_METADATA_UI_SCHEMA';
export const SET_METADATA_LOADING = 'GEONODE:SET_METADATA_LOADING';
export const SET_METADATA_ERROR = 'GEONODE:SET_METADATA_ERROR';
export const SET_METADATA_UPDATING = 'GEONODE:SET_METADATA_UPDATING';
export const SET_METADATA_UPDATE_ERROR = 'GEONODE:SET_METADATA_UPDATE_ERROR';
export const SET_METADATA_PREVIEW = 'GEONODE:SET_METADATA_PREVIEW';
export const SET_METADATA_RESOURCE = 'GEONODE:SET_METADATA_RESOURCE';
export const SET_METADATA_EXTRA_ERRORS = 'GEONODE:SET_METADATA_EXTRA_ERRORS';

export const setMetadata = (metadata) => ({
    type: SET_METADATA,
    metadata
});

export const setInitialMetadata = (initialMetadata) => ({
    type: SET_INITIAL_METADATA,
    initialMetadata
});

export const setMetadataSchema = (schema) => ({
    type: SET_METADATA_SCHEMA,
    schema
});

export const setMetadataUISchema = (uiSchema) => ({
    type: SET_METADATA_UI_SCHEMA,
    uiSchema
});

export const setMetadataLoading = (loading) => ({
    type: SET_METADATA_LOADING,
    loading
});

export const setMetadataError = (error) => ({
    type: SET_METADATA_ERROR,
    error
});

export const setMetadataUpdating = (updating) => ({
    type: SET_METADATA_UPDATING,
    updating
});

export const setMetadataUpdateError = (updateError) => ({
    type: SET_METADATA_UPDATE_ERROR,
    updateError
});

export const setMetadataPreview = (preview) => ({
    type: SET_METADATA_PREVIEW,
    preview
});

export const setMetadataResource = (resource) => ({
    type: SET_METADATA_RESOURCE,
    resource
});

export const setExtraErrors = (extraErrors) => ({
    type: SET_METADATA_EXTRA_ERRORS,
    extraErrors
});
