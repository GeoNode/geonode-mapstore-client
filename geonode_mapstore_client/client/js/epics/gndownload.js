/*
 * Copyright 2022, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Observable } from 'rxjs';
import axios from '@mapstore/framework/libs/ajax';
import { saveAs } from 'file-saver';
import { DOWNLOAD_METADATA, downloadMetaDataComplete } from '@js/actions/gndownload';
import {
    error as errorNotification
} from '@mapstore/framework/actions/notifications';

export const gnDownloadMetaData = (action$, store) =>
    action$.ofType(DOWNLOAD_METADATA)
        .switchMap((action) => {
            const state = store.getState();
            const url = state.gnresource?.data?.links?.find((link) => link.name === action.link).url;
            const resourceTitle = state.gnresource?.data?.title;

            return Observable
                .defer(() => axios.get(url).then((data) => data))
                .switchMap(({ data, headers }) => {
                    if (headers["content-type"] === "application/xml" || headers["content-type"] === "application/xml; charset=UTF-8") {
                        let xml = String.fromCharCode.apply(null, new Uint8Array(data));
                        if (xml.indexOf("<ows:ExceptionReport") === 0) {
                            throw xml;
                        }
                    }
                    saveAs(new Blob([data], { type: headers && headers["content-type"] }), `${resourceTitle}_${action.link.split(' ').join('_')}_Metadata`);
                    return Observable.of(downloadMetaDataComplete(action.link, action.pk));
                })
                .catch((error) => {
                    return Observable.of(
                        downloadMetaDataComplete(action.link, action.pk),
                        errorNotification({ title: "gnviewer.cannotPerfomAction", message: error?.data?.message || error?.data?.detail || error?.originalError?.message || "gnviewer.syncErrorDefault" }));
                });

        });

export default {
    gnDownloadMetaData
};
