/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import { htmlToDraftJSEditorState, draftJSEditorStateToHtml } from '@mapstore/framework/utils/EditorUtils';
import { Editor } from 'react-draft-wysiwyg';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

function RichTextEditor({
    value,
    onChange,
    id,
    ...props
}) {
    const [editorState, setEditorState] = useState(htmlToDraftJSEditorState(value || ''));
    return (
        <div {...{ 'data-ms-id': `${id}-rich-text-editor` }}>
            <Editor
                {...props}
                editorState={editorState}
                onEditorStateChange={(newEditorState) => {
                    const previousHTML = draftJSEditorStateToHtml(editorState);
                    const newHTML = draftJSEditorStateToHtml(newEditorState);
                    if (newHTML !== previousHTML) {
                        onChange(newHTML);
                        setEditorState(newEditorState);
                    }
                }}
            />
        </div>
    );
}

export default RichTextEditor;
