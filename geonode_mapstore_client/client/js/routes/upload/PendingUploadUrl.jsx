/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from "react";
import Select from "react-select";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";

import FaIcon from "@js/components/FaIcon";
import Button from "@js/components/Button";
import { isValidURL } from "@mapstore/framework/utils/URLUtils";
import Message from '@mapstore/framework/components/I18N/Message';
import { getFileNameAndExtensionFromUrl } from "@js/utils/FileUtils";

export default ({
    supportedLabels,
    baseName,
    extension,
    docUrl,
    loading,
    progress,
    index,
    supported,
    uploadUrls,
    setUploadUrls,
    onAddUrl,
    onRemove,
    onAbort,
    onRemoveUrl
} = {}) => {

    const _supportedLabels = supportedLabels?.split(',')
        ?.map(label => label.trim())
        ?.map(label => ({value: label, label})) ?? [];

    const isDuplicateUrl = (documentUrls = uploadUrls, _docUrl = docUrl) => {
        const urls = documentUrls.map(d => d.docUrl);
        const hasSameUrl = urls?.filter(doc => doc === _docUrl)?.length > 1;
        return hasSameUrl && urls.indexOf(docUrl) !== index;
    };

    const onChange = (event) => {
        const {value, name} = event.target ?? {};
        let documentUrls = [...uploadUrls];
        if (name === 'docUrl') {
            let fileName = "";
            let ext = "";
            if (isValidURL(value)) {
                const data = getFileNameAndExtensionFromUrl(value);
                fileName = data.fileName;
                ext = data.ext;
            }
            let supportedUrl = !isEmpty(value) && _supportedLabels.some(({label}) => label === ext);
            documentUrls[index] = {
                ...documentUrls[index],
                [name]: value,
                baseName: fileName,
                supported: supportedUrl && !isDuplicateUrl(documentUrls, documentUrls[index]?.docUrl),
                extension: ext
            };
        } else {
            documentUrls[index] = {
                ...documentUrls[index],
                supported: !isEmpty(baseName) && !isEmpty(value),
                [name]: value
            };
        }
        setUploadUrls(documentUrls);
        onAddUrl(documentUrls);
    };

    const onClickRemove = () => {
        onRemoveUrl((onUnsupportedUrl) => {
            !isDuplicateUrl(uploadUrls) && onRemove(baseName);
            const filteredUploadUrls = uploadUrls.filter((_, docIndex) => docIndex !== index);
            setUploadUrls(filteredUploadUrls);
            onUnsupportedUrl(filteredUploadUrls);
        });

    };

    const hasExtensionInUrl = () => {
        const {ext} = getFileNameAndExtensionFromUrl(docUrl);
        return !isEmpty(ext);
    };

    const isNotSupported = () => !isNil(supported) && !supported;

    return (
        <div className={"gn-upload-card gn-upload-url"}>
            <div className="gn-upload-card-header">
                <div className="gn-upload-input">
                    <input className={"form-control"} name={"docUrl"} value={docUrl || ""} onChange={(e) => onChange(e)}/>
                    {isNotSupported() && <div className="gn-upload-error-inline"><FaIcon name="exclamation" /></div>}
                    {onRemove
                        ? (!loading || !(progress?.[baseName]))
                            ? <Button size="xs" onClick={onClickRemove}>
                                <FaIcon name="trash" />
                            </Button> : <Button size="xs" onClick={() => onAbort(baseName)}>
                                <FaIcon name="stop" />
                            </Button>
                        : null
                    }
                </div>
            </div>
            {(isDuplicateUrl() || isNotSupported()) && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId={isNotSupported()
                        ? 'gnviewer.unsupportedUrlExtension'
                        : 'gnviewer.duplicateUrl'} />
                </div>
            </div>}
            <div className={"gn-upload-card-bottom"}>
                <Select
                    disabled={isEmpty(docUrl) || !isValidURL(docUrl) || hasExtensionInUrl()}
                    clearable={false}
                    placeholder={"ext"}
                    options={_supportedLabels}
                    value={extension}
                    onChange={(option) => onChange({ target: {...option, name: 'extension'} || {} })}
                />
            </div>
            {loading && progress && progress?.[baseName] && <div style={{ position: 'relative' }}>
                <div
                    className="gn-upload-card-progress"
                    style={{
                        width: '100%',
                        height: 2
                    }}
                >
                    <div
                        style={{
                            width: `${progress[baseName]}%`,
                            height: 2,
                            transition: '0.3s all'
                        }}
                    >
                    </div>
                </div>
            </div>}
        </div>
    );
};
