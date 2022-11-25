/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { forwardRef } from 'react';
import ContentEditable from 'react-contenteditable';


const TextEditable = forwardRef(({
    text = "",
    className = "gn-text-editable",
    tagName,
    disabled,
    onEdit = () => {}

}, ref ) => {
    return (<ContentEditable
        innerRef={ref}
        className={className}
        html={text}
        tagName={tagName}
        disabled={disabled}
        onClick={evt => {
            evt.stopPropagation();
        }}
        onChange={(evt) => {
            onEdit(evt.target.value);
        }}

    />);
});


export default TextEditable;
