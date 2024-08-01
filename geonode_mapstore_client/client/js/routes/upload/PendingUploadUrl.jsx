/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from "react";
import Select from "react-select";
import { FormControl as FormControlRB } from 'react-bootstrap';
import FaIcon from "@js/components/FaIcon";
import Button from "@js/components/Button";
import { isValidURL } from "@mapstore/framework/utils/URLUtils";
import Message from '@mapstore/framework/components/I18N/Message';
import { getFileNameAndExtensionFromUrl } from "@js/utils/FileUtils";
import { isNotSupported, getErrorMessageId, hasExtensionInUrl  } from "@js/utils/UploadUtils";
import withDebounceOnCallback from '@mapstore/framework/components/misc/enhancers/withDebounceOnCallback';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
import ErrorMessageWithTooltip from './ErrorMessageWithTooltip';
const FormControl = localizedProps('placeholder')(FormControlRB);
function InputControl({ onChange, value, debounceTime, ...props }) {
    return <FormControl {...props} value={value} onChange={event => onChange(event.target.value)}/>;
}
const InputControlWithDebounce = withDebounceOnCallback('onChange', 'value')(InputControl);

const PendingUploadUrl = ({
    data,
    extensions,
    serviceTypes,
    loading,
    progress,
    onChange,
    onRemove,
    onAbort,
    error
} = {}) => {

    const {
        baseName,
        extension,
        remoteUrl,
        serviceType,
        validation,
        edited
    } = data || {};

    const updateProperty = (name, value) => {
        if (name === 'remoteUrl') {
            const { ext } = isValidURL(value)
                ? getFileNameAndExtensionFromUrl(value)
                : { fileName: '', ext: '' };
            return {
                ...data,
                [name]: value,
                baseName: value,
                extension: ext,
                edited: true
            };
        }
        return {
            ...data,
            [name]: value,
            edited: true
        };
    };

    const handleOnChange = ({ value, name } = {}) => {
        const newEntry = updateProperty(name, value);
        return onChange(newEntry);
    };

    function handleOnRemove() {
        onRemove(data);
    }

    return (
        <div className={"gn-upload-card gn-upload-url"}>
            <div className="gn-upload-card-header">
                <div className="gn-upload-input">
                    <InputControlWithDebounce
                        value={remoteUrl || ""}
                        placeholder="gnviewer.remoteResourceURLPlaceholder"
                        debounceTime={300}
                        onChange={(value) => handleOnChange({
                            name: 'remoteUrl',
                            value
                        })}/>
                    {edited && <>
                        {!isNotSupported(data) && error ? <ErrorMessageWithTooltip tooltipId={<Message msgId="gnviewer.invalidRemoteUploadMessageErrorTooltip" />} /> : null}
                        {isNotSupported(data) && <div className="gn-upload-error-inline"><FaIcon name="exclamation" /></div>}
                    </>}
                    {onRemove
                        ? (!loading || !(progress?.[baseName]))
                            ? <Button size="xs" onClick={handleOnRemove}>
                                <FaIcon name="trash" />
                            </Button> : <Button size="xs" onClick={() => onAbort(baseName)}>
                                <FaIcon name="stop" />
                            </Button>
                        : null
                    }
                </div>
            </div>
            {(edited && isNotSupported(data)) && <div className="gn-upload-card-body">
                <div className="text-danger">
                    <Message msgId={getErrorMessageId(data)} />
                </div>
            </div>}
            {extensions && <div className={"gn-upload-card-bottom"}>
                <Select
                    disabled={!validation?.isValidRemoteUrl || hasExtensionInUrl(data) }
                    clearable={false}
                    placeholder={"ext"}
                    options={extensions}
                    value={extension}
                    onChange={(option) => handleOnChange({...option, name: 'extension'})}
                />
            </div>}
            {serviceTypes && <div className={"gn-upload-card-bottom"}>
                <Select
                    clearable={false}
                    placeholder={"type"}
                    options={serviceTypes}
                    value={serviceType}
                    onChange={(option) => handleOnChange({...option, name: 'serviceType'})}
                />
            </div>}
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

export default PendingUploadUrl;
