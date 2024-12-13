
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

function ArrayFieldTemplate(props) {
    const {
        canAdd,
        disabled,
        idSchema,
        uiSchema,
        items,
        onAddClick,
        readonly,
        registry,
        required,
        schema,
        title
    } = props;
    const uiOptions = getUiOptions(uiSchema);
    const ArrayFieldDescriptionTemplate = getTemplate(
        'ArrayFieldDescriptionTemplate',
        registry,
        uiOptions
    );
    const ArrayFieldItemTemplate = getTemplate(
        'ArrayFieldItemTemplate',
        registry,
        uiOptions
    );
    const ArrayFieldTitleTemplate = getTemplate(
        'ArrayFieldTitleTemplate',
        registry,
        uiOptions
    );
    // Button templates are not overridden in the uiSchema
    const {
        ButtonTemplates: { AddButton }
    } = registry.templates;
    return (
        <div id={idSchema.$id}>
            <div className="field-array-header">
                <ArrayFieldTitleTemplate
                    idSchema={idSchema}
                    title={uiOptions.title || title}
                    required={required}
                    schema={schema}
                    uiSchema={uiSchema}
                    registry={registry}
                    description={<ArrayFieldDescriptionTemplate
                        idSchema={idSchema}
                        description={uiOptions.description || schema.description}
                        schema={schema}
                        uiSchema={uiSchema}
                        registry={registry}
                    />}
                />
                {canAdd && (
                    <AddButton
                        className="array-item-add"
                        onClick={onAddClick}
                        disabled={disabled || readonly}
                        uiSchema={uiSchema}
                        registry={registry}
                    />
                )}
            </div>
            <div className="array-item-list">
                {items &&
                    items.map(({ key, ...itemProps }) => (
                        <ArrayFieldItemTemplate key={key} {...itemProps} />
                    ))}
            </div>
        </div>
    );
}

export default ArrayFieldTemplate;
