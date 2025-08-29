/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import isFunction from 'lodash/isFunction';

const cancelTokens = {};
const sources = {};

const useUpload = ({
    api,
    onComplete = () => {}
}) => {

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [completed, setCompleted] = useState({});
    const [progress, setProgress] = useState({});

    const getUploadRequestPayload = (upload, action) => {
        const bodyConfig = api?.body?.[upload?.type];
        let payload = Object.keys(bodyConfig).reduce((acc, key) => {
            return {
                ...acc,
                [key]: isFunction(bodyConfig[key])
                    ? bodyConfig[key]({ upload })
                    : bodyConfig[key]
            };
        }, {});
        const actionToUse = action ? action : payload?.action;
        const extraBody = api?.bodyExtra?.[actionToUse]?.[upload?.type] || {};
        payload = {
            ...payload,
            ...extraBody,
            action: actionToUse
        };
        if (upload.files) {
            Object.keys(upload.files).forEach((ext) => {
                payload[`${ext}_file`] = upload.files[ext];
            });
        }
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
            if (payload[key] !== undefined) {
                formData.append(key, payload[key]);
            }
        });
        return formData;
    };

    const onUploadProgress = (uploadId) => (_progress) => {
        const percentCompleted = Math.floor((_progress.loaded * 100) / _progress.total);
        setProgress((prevFiles) => ({ ...prevFiles, [uploadId]: percentCompleted }));
    };

    return {
        loading,
        errors,
        completed,
        progress,
        cancelRequest: (uploadIds) => {
            setProgress(prevProgress => ({
                ...prevProgress,
                ...uploadIds.reduce((acc, uploadId) => ({ ...acc, [uploadId]: undefined }), {})
            }));
            uploadIds.forEach((uploadId) => sources[uploadId].cancel());
        },
        uploadRequest: (uploads, action) => {
            if (!loading) {
                setLoading(true);
                setErrors({});
                setProgress({});
                axios.all(uploads.map((upload) => {
                    cancelTokens[upload.id] = axios.CancelToken;
                    sources[upload.id] = cancelTokens[upload.id].source();
                    const config = {
                        onUploadProgress: onUploadProgress(upload.id),
                        cancelToken: sources[upload.id].token
                    };
                    const payload = getUploadRequestPayload(upload, action);
                    return axios[api.method || 'post'](api.url, payload, config)
                        .then(({ data }) => ({ status: 'success', data, id: upload.id, upload }))
                        .catch((error) => {
                            if (axios.isCancel(error)) {
                                return { status: 'error', error: 'CANCELED', id: upload.id };
                            }
                            const { data } = error;
                            return { status: 'error', error: data, id: upload.id };
                        });
                }))
                    .then((responses) => {
                        const successfulUploads = responses.filter(({ status }) => status === 'success');
                        const errorUploads = responses.filter(({ status }) => status === 'error');
                        if (errorUploads.length > 0) {
                            setErrors(errorUploads.reduce((acc, errorUpload) => ({ ...acc, [errorUpload.id]: errorUpload.error }), {}));
                        }
                        if (successfulUploads.length > 0) {
                            setCompleted(successfulUploads.reduce((acc, successfulUpload) => ({ ...acc, [successfulUpload.id]: true }), {}));
                        }
                        onComplete(responses, successfulUploads, errorUploads);
                    })
                    .finally(() => setLoading(false));
            }
        }
    };
};

export default useUpload;
