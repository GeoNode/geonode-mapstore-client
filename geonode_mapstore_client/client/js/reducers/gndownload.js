/*
 * Copyright 2022s, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import { DOWNLOAD_METADATA, DOWNLOAD_METADATA_COMPLETE } from '@js/actions/gndownload';

const defaultState = {
    downloads: {
        ISO: {},
        DublinCore: {}
    }
};

function gnDownload(state = defaultState, action) {

    switch (action.type) {
    case DOWNLOAD_METADATA: {
        const linkType = action?.link?.split(' ').join('');
        return {
            ...state,
            downloads: {
                ...state.downloads,
                [linkType]: {
                    [action.pk]: true
                }
            }
        };
    }
    case DOWNLOAD_METADATA_COMPLETE: {
        const linkType = action?.link?.split(' ').join('');
        // copy the link bucket before deleting so the previous state is not mutated
        const remaining = { ...(state.downloads[linkType] || {}) };
        delete remaining[action.pk];
        return {
            ...state,
            downloads: {
                ...state.downloads,
                [linkType]: remaining
            }
        };
    }
    default:
        return state;
    }
}

export default gnDownload;
