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
        const newState = { ...state };
        const linkType = action?.link?.split(' ').join('');
        const downloads = newState.downloads[linkType];
        delete downloads[action.pk];
        return {
            ...newState,
            downloads: {
                ...newState.downloads,
                [linkType]: {
                    ...downloads
                }
            }
        };
    }
    default:
        return state;
    }
}

export default gnDownload;
