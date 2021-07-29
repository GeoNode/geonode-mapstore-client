/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import {
    RESOURCE_LOADING,
    SET_RESOURCE,
    RESOURCE_ERROR,
    UPDATE_RESOURCE_PROPERTIES,
    SET_RESOURCE_TYPE,
    SET_NEW_RESOURCE,
    SET_RESOURCE_ID,
    SET_RESOURCE_PERMISSIONS,
    EDIT_TITLE_RESOURCE,
    EDIT_ABSTRACT_RESOURCE,
    EDIT_THUMBNAIL_RESOURCE,
    SET_SELECTED_DATASET_PERMISSIONS,
    RESET_RESOURCE_STATE,
    LOADING_RESOURCE_CONFIG,
    RESOURCE_CONFIG_ERROR
} from '@js/actions/gnresource';

const defaultState = {
    selectedLayerPermissions: [],
    data: {},
    permissions: []
};

function gnresource(state = defaultState, action) {
    switch (action.type) {
    case RESET_RESOURCE_STATE: {
        return defaultState;
    }
    case LOADING_RESOURCE_CONFIG: {
        return {
            ...state,
            configError: undefined,
            loadingResourceConfig: action.loading
        };
    }
    case RESOURCE_CONFIG_ERROR: {
        return {
            ...state,
            loading: false,
            configError: action.message
        };
    }
    case RESOURCE_LOADING: {
        return {
            ...state,
            loading: true
        };
    }
    case SET_RESOURCE: {
        return {
            ...state,
            error: null,
            data: action.data,
            loading: false,
            isNew: false
        };
    }
    case RESOURCE_ERROR: {
        return {
            ...state,
            data: null,
            error: action.error,
            loading: false
        };
    }
    case UPDATE_RESOURCE_PROPERTIES: {
        return {
            ...state,
            data: {
                ...state.data,
                ...action.properties
            }
        };
    }
    case SET_RESOURCE_TYPE: {
        return {
            ...state,
            type: action.resourceType
        };
    }
    case SET_NEW_RESOURCE: {
        return {
            ...defaultState,
            isNew: true
        };
    }
    case SET_RESOURCE_ID: {
        return {
            ...state,
            id: action.id
        };
    }
    case SET_RESOURCE_PERMISSIONS: {
        return {
            ...state,
            permissions: action.permissions
        };
    }

    case EDIT_TITLE_RESOURCE: {
        return {
            ...state,
            data: {
                ...state?.data,
                title: action?.title,
                name: action?.title
            }
        };
    }

    case EDIT_ABSTRACT_RESOURCE: {
        return {
            ...state,
            data: {
                ...state?.data,
                "abstract": action?.abstract
            }
        };
    }

    case EDIT_THUMBNAIL_RESOURCE: {
        return {
            ...state,
            data: {
                ...state?.data,
                thumbnail_url: action?.thumbnailUrl
            }
        };
    }

    case SET_SELECTED_DATASET_PERMISSIONS:
        return {
            ...state,
            selectedLayerPermissions: action.permissions
        };
    default:
        return state;
    }
}

export default gnresource;
