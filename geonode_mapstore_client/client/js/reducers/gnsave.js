/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import {
    SAVING_RESOURCE,
    SAVE_SUCCESS,
    SAVE_ERROR,
    CLEAR_SAVE,
    SAVE_DIRECT_CONTENT
} from '@js/actions/gnsave';

function gnsave(state = {}, action) {
    switch (action.type) {
    case SAVING_RESOURCE :
    case SAVE_DIRECT_CONTENT: {
        return {
            saving: true
        };
    }
    case SAVE_SUCCESS: {
        return {
            success: action.success,
            saving: false
        };
    }
    case SAVE_ERROR: {
        return {
            error: action.error,
            saving: false
        };
    }
    case CLEAR_SAVE: {
        return {};
    }
    default:
        return state;
    }
}

export default gnsave;
