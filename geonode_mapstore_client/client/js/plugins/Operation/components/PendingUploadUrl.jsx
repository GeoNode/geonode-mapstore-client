/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from "react";
import Select from "react-select";
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import Button from '@mapstore/framework/components/layout/Button';
import { isValidURL } from "@mapstore/framework/utils/URLUtils";
import Message from '@mapstore/framework/components/I18N/Message';
import { getFileNameAndExtensionFromUrl } from "@js/utils/FileUtils";
import { isNotSupported, getErrorMessageId  } from "@js/utils/UploadUtils";
import ErrorMessageWithTooltip from './ErrorMessageWithTooltip';
import InputControl from '@mapstore/framework/plugins/ResourcesCatalog/components/InputControl';

const PendingUploadUrl = ({
    data,
    loading,
    progress,
    error,
    onCancel,
    onRemove,
    onChange,
    remoteTypes,
    remoteTypesPlaceholder = 'type',
    remoteTypeFromUrl = false,
    remoteTypeErrorMessageId = 'gnviewer.unsupportedUrlExtension',
    isRemoteTypesDisabled = () => false
} = {}) => {

    const updateProperty = (name, value) => {
        let remoteType = data?.remoteType;
        if (remoteTypeFromUrl && name === 'url') {
            const { ext } = isValidURL(value)
                ? getFileNameAndExtensionFromUrl(value)
                : { fileName: '', ext: '' };
            remoteType = ext;
        }
        return {
            ...data,
            remoteType,
            [name]: value,
            edited: true
        };
    };

    const handleOnChange = ({ value, name } = {}) => {
        const newEntry = updateProperty(name, value);
        return onChange(newEntry);
    };

    function handleOnRemove() {
        onRemove(data.id);
    }

    return (
        <div className={"gn-upload-card gn-upload-url"}>
            <div className="gn-upload-card-header">
                <div className="gn-upload-input">
                    <InputControl
                        value={data.url || ""}
                        placeholder="gnviewer.remoteResourceURLPlaceholder"
                        debounceTime={300}
                        onChange={(value) => handleOnChange({
                            name: 'url',
                            value
                        })}/>
                    {data.edited && <>
                        {!isNotSupported(data) && error ? <ErrorMessageWithTooltip tooltipId={<Message msgId="gnviewer.invalidRemoteUploadMessageErrorTooltip" />} /> : null}
                        {isNotSupported(data) && <div className="gn-upload-error-inline"><Icon glyph="exclamation" /></div>}
                    </>}
                    {onRemove
                        ? (!loading || !(progress))
                            ? <Button size="xs" onClick={handleOnRemove}>
                                <Icon glyph="trash" />
                            </Button> : <Button size="xs" onClick={() => onCancel([data.id])}>
                                <Icon glyph="stop" />
                            </Button>
                        : null
                    }
                </div>
            </div>
            {(data.edited && isNotSupported(data)) && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId={getErrorMessageId(data, { remoteTypeErrorMessageId })} />
                </div>
            </div>}
            {remoteTypes && <div className={"gn-upload-card-bottom"}>
                <Select
                    clearable={false}
                    disabled={isRemoteTypesDisabled(data)}
                    placeholder={remoteTypesPlaceholder}
                    options={remoteTypes}
                    value={data.remoteType}
                    onChange={(option) => handleOnChange({...option, name: 'remoteType'})}
                />
            </div>}
            {(loading && progress) ? <div style={{ position: 'relative' }}>
                <div
                    className="gn-upload-card-progress"
                    style={{
                        width: '100%',
                        height: 2
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: 2,
                            transition: '0.3s all'
                        }}
                    >
                    </div>
                </div>
            </div> : null}
        </div>
    );
};

export default PendingUploadUrl;
