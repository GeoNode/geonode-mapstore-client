/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
    SET_METADATA,
    SET_INITIAL_METADATA,
    SET_METADATA_SCHEMA,
    SET_METADATA_UI_SCHEMA,
    SET_METADATA_LOADING,
    SET_METADATA_ERROR,
    SET_METADATA_UPDATING,
    SET_METADATA_UPDATE_ERROR,
    SET_METADATA_PREVIEW,
    SET_METADATA_RESOURCE,
    SET_METADATA_EXTRA_ERRORS
} from '../actions/metadata';

function metadata(state = {}, action) {
    switch (action.type) {
    case SET_METADATA: {
        return {
            ...state,
            metadata: action.metadata
        };
    }
    case SET_INITIAL_METADATA: {
        return {
            ...state,
            initialMetadata: action.initialMetadata
        };
    }
    case SET_METADATA_SCHEMA: {
        return {
            ...state,
            schema: action.schema
        };
    }
    case SET_METADATA_UI_SCHEMA: {
        return {
            ...state,
            uiSchema: action.uiSchema
        };
    }
    case SET_METADATA_LOADING: {
        return {
            ...state,
            loading: action.loading
        };
    }
    case SET_METADATA_ERROR: {
        return {
            ...state,
            error: action.error
        };
    }
    case SET_METADATA_UPDATING: {
        return {
            ...state,
            updating: action.updating
        };
    }
    case SET_METADATA_UPDATE_ERROR: {
        return {
            ...state,
            updateError: action.updateError
        };
    }
    case SET_METADATA_PREVIEW: {
        return {
            ...state,
            preview: action.preview
        };
    }
    case SET_METADATA_RESOURCE: {
        return {
            ...state,
            resource: action.resource
        };
    }
    case SET_METADATA_EXTRA_ERRORS: {
        return {
            ...state,
            extraErrors: action.extraErrors
        };
    }
    default:
        return state;
    }
}

export default metadata;
