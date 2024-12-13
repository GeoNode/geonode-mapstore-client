/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
    getTemplate,
    getUiOptions
} from '@rjsf/utils';

function FieldTemplate(props) {
    const { id, label, children, errors, help, description, hidden, required, displayLabel, registry, uiSchema } = props;
    const uiOptions = getUiOptions(uiSchema);
    const WrapIfAdditionalTemplate = getTemplate(
        'WrapIfAdditionalTemplate',
        registry,
        uiOptions
    );
    if (hidden) {
        return <div className="hidden">{children}</div>;
    }
    return (
        <WrapIfAdditionalTemplate {...props}>
            {displayLabel &&
                <label className="control-label" htmlFor={id}>
                    {label}
                    {required && <span className="required">{' '}*</span>}
                    {description ? <>{' '}{description}</> : null}
                </label>}
            {children}
            {errors}
            {help}
        </WrapIfAdditionalTemplate>
    );
}

export default FieldTemplate;
