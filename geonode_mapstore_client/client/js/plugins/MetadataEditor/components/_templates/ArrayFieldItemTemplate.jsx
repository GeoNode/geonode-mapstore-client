/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

function ArrayFieldItemTemplate(props) {
    const {
        children,
        className,
        disabled,
        hasToolbar,
        hasMoveDown,
        hasMoveUp,
        hasRemove,
        hasCopy,
        index,
        onCopyIndexClick,
        onDropIndexClick,
        onReorderClick,
        readonly,
        registry,
        uiSchema
    } = props;
    const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
    return (
        <div className={className}>
            {children}
            {hasToolbar && (
                <>
                    {(hasMoveUp || hasMoveDown) && (
                        <MoveUpButton
                            disabled={disabled || readonly || !hasMoveUp}
                            onClick={onReorderClick(index, index - 1)}
                            uiSchema={uiSchema}
                            registry={registry}
                        />
                    )}
                    {(hasMoveUp || hasMoveDown) && (
                        <MoveDownButton
                            disabled={disabled || readonly || !hasMoveDown}
                            onClick={onReorderClick(index, index + 1)}
                            uiSchema={uiSchema}
                            registry={registry}
                        />
                    )}
                    {hasCopy && (
                        <CopyButton
                            disabled={disabled || readonly}
                            onClick={onCopyIndexClick(index)}
                            uiSchema={uiSchema}
                            registry={registry}
                        />
                    )}
                    {hasRemove && (
                        <RemoveButton
                            disabled={disabled || readonly}
                            onClick={onDropIndexClick(index)}
                            uiSchema={uiSchema}
                            registry={registry}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default ArrayFieldItemTemplate;
