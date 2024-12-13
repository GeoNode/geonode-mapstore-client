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
    getUiOptions,
    titleId
} from '@rjsf/utils';

function ArrayFieldTitleTemplate(props) {
    const { idSchema, title, schema, uiSchema, required, registry, description } = props;
    const options = getUiOptions(uiSchema, registry.globalUiOptions);
    const { label: displayLabel = true } = options;
    if (!title || !displayLabel) {
        return null;
    }
    const TitleFieldTemplate = getTemplate(
        'TitleFieldTemplate',
        registry,
        options
    );
    return (
        <TitleFieldTemplate
            id={titleId(idSchema)}
            title={title}
            required={required}
            schema={schema}
            uiSchema={uiSchema}
            registry={registry}
            description={description}
        />
    );
}

export default ArrayFieldTitleTemplate;
