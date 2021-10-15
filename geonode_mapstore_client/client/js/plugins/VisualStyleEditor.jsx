/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Glyphicon, FormControl as FormControlRB } from 'react-bootstrap';
import { StyleCodeEditor } from '@mapstore/framework/plugins/styleeditor/index';
import styleeditor from '@mapstore/framework/reducers/styleeditor';
import styleeditorEpics from '@mapstore/framework/epics/styleeditor';
import visualStyleEditorEpics from '@js/epics/visualstyleeditor';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import {
    updateStatus,
    initStyleService,
    updateStyleCode,
    toggleStyleEditor,
    editStyleCode,
    updateEditorMetadata
} from '@mapstore/framework/actions/styleeditor';
import {
    createGeoNodeStyle,
    deleteGeoNodeStyle,
    requestDatasetAvailableStyles
} from '@js/actions/visualstyleeditor';

import { updateSettingsParams } from '@mapstore/framework/actions/layers';
import { zoomToExtent } from '@mapstore/framework/actions/map';
import {
    getUpdatedLayer,
    temporaryIdSelector,
    initialCodeStyleSelector,
    codeStyleSelector,
    styleServiceSelector,
    selectedStyleFormatSelector,
    geometryTypeSelector,
    loadingStyleSelector,
    errorStyleSelector,
    selectedStyleSelector
} from '@mapstore/framework/selectors/styleeditor';
import Select from 'react-select';
import Message from '@mapstore/framework/components/I18N/Message';
import SVGPreview from '@mapstore/framework/components/styleeditor/SVGPreview';
import Popover from '@mapstore/framework/components/styleeditor/Popover';
import Button from '@js/components/Button';
import Portal from '@mapstore/framework/components/misc/Portal';
import ResizableModal from '@mapstore/framework/components/misc/ResizableModal';
import StylesAPI from '@mapstore/framework/api/geoserver/Styles';
import { getStyleTemplates } from '@mapstore/framework/utils/StyleEditorUtils';
import Spinner from '@js/components/Spinner';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
const FormControl = localizedProps('placeholder')(FormControlRB);

const defaultStyleTemplates = getStyleTemplates().filter((styleTemplate) => !['Base CSS', 'Base SLD'].includes(styleTemplate.title));

function SaveStyleButton({
    variant,
    onClick,
    size,
    isStyleChanged,
    error,
    loading
}) {
    const isDisabled = !!(loading || error);
    return (
        <Button
            className={isStyleChanged ? 'gn-pending-changes-icon' : ''}
            variant={variant || "primary"}
            size={size}
            disabled={isDisabled}
            onClick={isDisabled ? () => {} : () => onClick()}
        >
            <Message msgId="save"/>{' '}{loading && <Spinner />}
        </Button>
    );
}

const ConnectedSaveStyleButton = connect(
    createSelector([
        initialCodeStyleSelector,
        codeStyleSelector,
        loadingStyleSelector,
        errorStyleSelector
    ], (initialCode, code, loading, error) => ({
        isStyleChanged: initialCode !== undefined && code !== undefined && initialCode !== code,
        loading,
        error: !!error?.edit?.status
    })),
    {
        onClick: updateStyleCode
    }
)((SaveStyleButton));

function VisualStyleEditor({
    layer,
    editorConfig,
    styleService,
    onInit,
    onUpdateStatus,
    onUpdateParams,
    onReset,
    temporaryStyleId,
    showLayerProperties,
    geometryType,
    format,
    onSelect,
    onUpdateMetadata,
    initialCode,
    enabled,
    onClose,
    onZoomTo,
    onRefresh,
    onCreate,
    onDelete,
    selectedStyle
}) {

    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [title, setTitle] = useState('');

    const deleteStyle = useRef();

    deleteStyle.current = () => {
        if (temporaryStyleId) {
            StylesAPI.deleteStyle({
                baseUrl: styleService.baseUrl,
                styleName: temporaryStyleId
            });
        }
    };

    useEffect(() => {
        onInit(styleService);
        function onBeforeUnload() {
            deleteStyle.current();
        }
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            onReset();
        };
    }, []);

    function handleStyleChange(option) {
        onUpdateParams({
            style: option.value
        }, true);
        onUpdateStatus('edit');
    }

    function handleSelect(styleTemplate) {
        onSelect(styleTemplate);
        onUpdateMetadata({ styleJSON: null });
    }

    function handleClose() {
        onReset();
        onClose();
    }

    function handleZoomTo() {
        const { minx, miny, maxx, maxy } = layer.bbox.bounds;
        const extent = [minx, miny, maxx, maxy];
        onZoomTo(extent, layer.bbox.crs);
    }

    function handleRefresh() {
        onRefresh(layer, { forceUpdate: true });
    }

    const styleTemplates = defaultStyleTemplates.filter((styleTemplate) => styleTemplate.types.includes(geometryType) && format === styleTemplate.format);

    if (!enabled || !layer.id) {
        return null;
    }

    const hasAvailableStyles = !!(layer?.availableStyles?.length > 0);
    const hasTemplates = !!(styleTemplates?.length > 0);

    function replaceTemplateMetadata(code) {
        const styleTitle = selectedStyle?.metadata?.title || selectedStyle?.label || selectedStyle?.title || selectedStyle?.name || '';
        const styleDescription = selectedStyle?.metadata?.description || selectedStyle?._abstract || '';
        return code
            .replace(/\$\{styleTitle\}/, styleTitle)
            .replace(/\$\{styleAbstract\}/, styleDescription);
    }

    return (
        <div className="gn-visual-style-editor">
            {showLayerProperties &&
            <div className="gn-visual-style-editor-layer-info">
                <div className="gn-visual-style-editor-layer-title">{layer.title}</div>
                {layer.bbox && <Button onClick={handleZoomTo}>
                    <Glyphicon glyph="zoom-to"/>
                </Button>}
                <Button onClick={handleClose}>
                    <Glyphicon glyph="1-close"/>
                </Button>
            </div>}
            {(showLayerProperties && hasAvailableStyles) &&
            <div className="gn-visual-style-editor-styles">
                <div className="gn-visual-style-editor-styles-select">
                    <Select
                        value={layer.style || layer.availableStyles?.[0]?.name}
                        options={layer.availableStyles.map((style) => ({
                            value: style.name,
                            label: style.title
                        }))}
                        clearable={false}
                        onChange={handleStyleChange}
                    />
                </div>
                <Button onClick={handleRefresh}>
                    <Glyphicon glyph="refresh"/>
                </Button>
                <Button onClick={() => setDeleting(true)}>
                    <Glyphicon glyph="trash"/>
                </Button>
                <Button onClick={() => setCreating(true)}>
                    <Glyphicon glyph="plus"/>
                </Button>
            </div>}
            {(hasAvailableStyles && (hasTemplates || showLayerProperties)) &&
            <div className="gn-visual-style-editor-toolbar">
                {showLayerProperties && <ConnectedSaveStyleButton variant="default" size="xs"/>}
                {hasTemplates && <Popover
                    placement="right"
                    content={
                        <ul className="gn-visual-style-editor-templates" >
                            {styleTemplates.map((styleTemplate, idx) => {
                                return (
                                    <li
                                        key={idx}
                                        className="gn-visual-style-editor-template"
                                        onClick={() => handleSelect(replaceTemplateMetadata(styleTemplate.code))}
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
                    }
                >
                    <Button size="xs"><Message msgId="gnviewer.templates"/></Button>
                </Popover>}
            </div>}
            <div className="gn-visual-style-editor-body">
                <div>
                    <StyleCodeEditor key={initialCode} config={editorConfig}/>
                </div>
            </div>
            <Portal>
                <ResizableModal
                    title="Add new style"
                    fitContent
                    clickOutEnabled={false}
                    show={creating}
                    onClose={() => {
                        setCreating(false);
                        setTitle('');
                    }}
                    buttons={[
                        {
                            text: 'Close',
                            onClick: () => {
                                setCreating(false);
                                setTitle('');
                            }
                        },
                        {
                            text: 'Create',
                            onClick: () => {
                                setCreating(false);
                                onCreate(title);
                                setTitle('');
                            }
                        }
                    ]}
                >
                    <label>Title: </label>
                    <FormControl
                        value={title}
                        onChange={event => setTitle(event?.target?.value)}
                    />
                </ResizableModal>
            </Portal>
            <Portal>
                <ResizableModal
                    title="Delete style"
                    show={deleting}
                    fitContent
                    clickOutEnabled={false}
                    onClose={() => {
                        setDeleting(false);
                    }}
                    buttons={[
                        {
                            text: 'No, don\'t delete it',
                            onClick: () => {
                                setDeleting(false);
                            }
                        },
                        {
                            text: 'Yes, I\'m sure',
                            onClick: () => {
                                onDelete();
                                setDeleting(false);
                            }
                        }
                    ]}
                >
                    Are you sure you want to delete this style?
                </ResizableModal>
            </Portal>
        </div>
    );
}

const VisualStyleEditorPlugin = connect(
    createSelector([
        getUpdatedLayer,
        temporaryIdSelector,
        styleServiceSelector,
        selectedStyleFormatSelector,
        geometryTypeSelector,
        initialCodeStyleSelector,
        state => state?.controls?.visualStyleEditor?.enabled,
        selectedStyleSelector
    ], (layer, temporaryStyleId, styleService, format, geometryType, initialCode, enabled, selectedStyleName) => ({
        layer,
        temporaryStyleId,
        styleService,
        format,
        geometryType,
        initialCode,
        enabled,
        selectedStyle: layer?.availableStyles?.find((style) => style.name === selectedStyleName)
    })),
    {
        onUpdateStatus: updateStatus,
        onUpdateParams: updateSettingsParams,
        onInit: initStyleService,
        onReset: toggleStyleEditor.bind(null, undefined, false),
        onSelect: editStyleCode,
        onUpdateMetadata: updateEditorMetadata,
        onSave: updateStyleCode,
        onClose: setControlProperty.bind(null, 'visualStyleEditor', 'enabled', false),
        onZoomTo: zoomToExtent,
        onRefresh: requestDatasetAvailableStyles,
        onCreate: createGeoNodeStyle,
        onDelete: deleteGeoNodeStyle
    },
    (stateProps, dispatchProps, ownProps) => {
        // detect if the static service has been updated with new information in the global state
        // eg: classification methods are requested asynchronously
        const isStaticServiceUpdated = ownProps.styleService?.baseUrl === stateProps.styleService?.baseUrl
            && stateProps.styleService?.isStatic;
        const newStyleService = ownProps.styleService && !isStaticServiceUpdated
            ? { ...ownProps.styleService, isStatic: true }
            : { ...stateProps.styleService };
        return {
            ...ownProps,
            ...stateProps,
            ...dispatchProps,
            styleService: newStyleService
        };
    }
)(VisualStyleEditor);

function StyleEditorTocButton({
    layer,
    status,
    onClick = () => {}
}) {
    if (status !== 'LAYER') {
        return null;
    }

    function handleClick() {
        onClick(layer);
    }

    return (
        <Button
            variant="primary"
            className="square-button-md"
            onClick={handleClick}
        >
            <Glyphicon glyph="dropper"/>
        </Button>
    );
}

const ConnectedStyleEditorTocButton = connect(createSelector([
    getUpdatedLayer
], (layer) => ({
    layer
})), {
    onClick: requestDatasetAvailableStyles
})(StyleEditorTocButton);

export default createPlugin('VisualStyleEditor', {
    component: VisualStyleEditorPlugin,
    containers: {
        ViewerLayout: {
            name: 'VisualStyleEditor',
            priority: 1,
            target: 'leftColumn'
        },
        ActionNavbar: {
            name: 'SaveStyle',
            Component: ConnectedSaveStyleButton,
            priority: 1
        },
        TOC: {
            target: 'toolbar',
            Component: ConnectedStyleEditorTocButton,
            priority: 1
        }
    },
    reducers: {
        styleeditor
    },
    epics: {
        ...styleeditorEpics,
        ...visualStyleEditorEpics
    }
});
