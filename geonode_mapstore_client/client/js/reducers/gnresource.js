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
    SET_SELECTED_LAYER_PERMISSIONS
} from '@js/actions/gnresource';

function gnresource(state = {selectedLayerPermissions: [], data: {}}, action) {
    switch (action.type) {
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
            ...state,
            isNew: true,
            data: {}
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

    case SET_SELECTED_LAYER_PERMISSIONS:
        return {
            ...state,
            selectedLayerPermissions: action.permissions
        };
    default:
        return state;
    }
}

export default gnresource;
