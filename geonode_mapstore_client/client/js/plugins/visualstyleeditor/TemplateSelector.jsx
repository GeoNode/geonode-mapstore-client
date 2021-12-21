/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import Message from '@mapstore/framework/components/I18N/Message';
import SVGPreview from '@mapstore/framework/components/styleeditor/SVGPreview';
import Popover from '@mapstore/framework/components/styleeditor/Popover';
import GNButton from '@js/components/Button';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { getStyleParser } from '@mapstore/framework/utils/VectorStyleUtils';
import { getStyleTemplates } from '@js/api/geonode/config';
const Button = tooltip(GNButton);

function TemplateSelector({
    code,
    format,
    geometryType,
    onSelect,
    selectedStyle,
    onUpdateMetadata,
    onUpdate,
    tmpCode,
    onStoreTmpCode
}) {

    const isMounted = useRef();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState();

    useEffect(() => {
        isMounted.current = true;
        getStyleTemplates()
            .then((response) => {
                if (isMounted.current) {
                    setTemplates(response);
                }
            });
        return () => {
            isMounted.current = false;
        };
    }, []);

    function handleApply() {
        onStoreTmpCode(code);
        onUpdateMetadata({ styleJSON: null });
        onUpdate();
    }

    const storeTmpCode = useRef();
    storeTmpCode.current = (isOpen) => {
        if (isOpen) {
            onStoreTmpCode(code);
        } else {
            setSelectedTemplate(undefined);
            if (tmpCode) {
                onSelect(tmpCode);
            }
        }
    };

    function handleOpen(isOpen) {
        storeTmpCode.current(isOpen);
    }

    useEffect(() => {
        return () => {
            onStoreTmpCode('');
        };
    }, []);

    const styleTemplates = templates.filter((styleTemplate) => styleTemplate.types.includes(geometryType));
    const hasTemplates = styleTemplates?.length > 0;

    function handleSelect(styleTemplate) {
        onSelect(styleTemplate);
    }

    function replaceTemplateMetadata({ code: templateCode }, idx) {
        setSelectedTemplate(idx);
        const styleTitle = selectedStyle?.metadata?.title || selectedStyle?.label || selectedStyle?.title || selectedStyle?.name || '';
        getStyleParser(format)
            .writeStyle({
                ...templateCode,
                name: styleTitle
            })
            .then((updateCode) => {
                if (isMounted.current) {
                    handleSelect(updateCode);
                }
            });
    }

    if (!hasTemplates) {
        return null;
    }

    return (
        <Popover
            placement="right"
            onOpen={handleOpen}
            content={
                <div className="gn-visual-style-editor-templates" >
                    <ul >
                        {styleTemplates.map((styleTemplate, idx) => {
                            return (
                                <li
                                    key={idx}
                                    className={`gn-visual-style-editor-template${selectedTemplate === idx ? ' selected' : ''}`}
                                    onClick={() => replaceTemplateMetadata(styleTemplate, idx)}
                                >
                                    <div className="gn-visual-style-editor-template-preview">
                                        {styleTemplate?.preview?.config
                                            ? <SVGPreview { ...styleTemplate.preview.config } />
                                            : styleTemplate?.preview}
                                    </div>
                                    <div className="gn-visual-style-editor-template-title">{styleTemplate.title}</div>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="gn-visual-style-editor-templates-footer">
                        <Button size="xs" disabled={selectedTemplate === undefined} variant="primary" onClick={handleApply}><Message msgId="gnviewer.applyStyle"/></Button>
                    </div>
                </div>
            }
        >
            <Button size="xs"><Message msgId="gnviewer.copyFrom"/></Button>
        </Popover>
    );
}

export default TemplateSelector;
