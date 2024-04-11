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
import { Glyphicon } from 'react-bootstrap';
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
    requestDatasetAvailableStyles
} from '@js/actions/visualstyleeditor';

import { updateNode, updateSettingsParams } from '@mapstore/framework/actions/layers';
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
import Message from '@mapstore/framework/components/I18N/Message';
import GNButton from '@js/components/Button';
import Portal from '@mapstore/framework/components/misc/Portal';
import ResizableModal from '@mapstore/framework/components/misc/ResizableModal';
import StylesAPI from '@mapstore/framework/api/geoserver/Styles';
import { getResourcePerms, isNewResource, getViewedResourceType } from '@js/selectors/resource';
import { mapLayoutValuesSelector } from '@mapstore/framework/selectors/maplayout';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { getSelectedLayer, layersSelector } from '@mapstore/framework/selectors/layers';
import useLocalStorage from '@js/hooks/useLocalStorage';
import TemplateSelector from '@js/plugins/visualstyleeditor/TemplateSelector';

const Button = tooltip(GNButton);

function SaveStyleButton({
    variant,
    onClick,
    size,
    isStyleChanged,
    error,
    loading,
    layerLoading,
    msgId = 'gnviewer.applyStyle'
}) {
    const isDisabled = !!(loading || layerLoading || error);
    return isStyleChanged ? (
        <Button
            variant={variant || "primary"}
            className={isStyleChanged ? 'gn-pending-changes-icon' : ''}
            size={size}
            disabled={isDisabled}
            onClick={isDisabled ? () => {} : () => onClick()}
        >
            <Message msgId={msgId}/>
        </Button>
    ) : null;
}

const ConnectedSaveStyleButton = connect(
    createSelector([
        initialCodeStyleSelector,
        codeStyleSelector,
        loadingStyleSelector,
        errorStyleSelector,
        layersSelector
    ], (initialCode, code, loading, error, layers) => ({
        isStyleChanged: initialCode !== undefined && code !== undefined && initialCode !== code,
        loading,
        error: !!error?.edit?.status,
        layerLoading: layers && layers.some((layer) => layer.loading)
    })),
    {
        onClick: updateStyleCode
    }
)((SaveStyleButton));

const ConnectedTemplateSelector = connect(
    createSelector([
        getUpdatedLayer,
        geometryTypeSelector,
        selectedStyleFormatSelector,
        codeStyleSelector,
        selectedStyleSelector,
        state => state?.controls?.visualStyleEditor?.tmpCode
    ], (layer, geometryType, format, code, selectedStyleName, tmpCode) => ({
        geometryType,
        format,
        selectedStyle: layer?.availableStyles?.find(({ name }) => name === selectedStyleName),
        code,
        tmpCode
    })),
    {
        onSelect: editStyleCode,
        onUpdateMetadata: updateEditorMetadata,
        onStoreTmpCode: setControlProperty.bind(null, 'visualStyleEditor', 'tmpCode')
    }
)((TemplateSelector));

function VisualStyleEditor({
    layer,
    editorConfig,
    styleService,
    onInit,
    onReset,
    temporaryStyleId,
    showLayerProperties,
    initialCode,
    enabled,
    onClose,
    style: styleProp,
    isStyleChanged,
    resourceType
}) {

    const [closing, setClosing] = useState(false);

    // localstorage for style notification
    const [dismissStyleNotification, setDismissStyleNotification] = useLocalStorage('style-notifcation', false);
    const [notificationClose, setNotificationClose] = useState(false);

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

    function handleClose(close) {
        if (close) {
            onReset();
            onClose();
        } else {
            setClosing(true);
        }
    }

    if (!enabled || !layer.id) {
        return null;
    }

    function closeNotification() {
        setNotificationClose(true);
    }

    function dismissNotification() {
        setDismissStyleNotification(true);
    }

    return (
        <div className="gn-visual-style-editor" style={styleProp}>
            {showLayerProperties &&
            <div className="gn-visual-style-editor-layer-info">
                <div className="gn-visual-style-editor-layer-title">{layer.title}</div>
                <Button onClick={handleClose.bind(null, !isStyleChanged)} className="square-button">
                    <Glyphicon glyph="1-close"/>
                </Button>
            </div>}
            {(!notificationClose && !dismissStyleNotification) && resourceType === 'map' && <div className="gn-visual-style-editor-alert alert-info">
                <div className="gn-visual-style-editor-alert-message">
                    <Message msgId="gnviewer.stylesFirstClone" />
                    <Button size="xs" variant="transparent" onClick={dismissNotification}>
                        <p>
                            <Message msgId="gnviewer.dismissMessage" />
                        </p>
                    </Button>
                </div>
                <Button size="xs" variant="transparent" onClick={closeNotification}><Glyphicon glyph="remove" /></Button>
            </div>}
            <div className="gn-visual-style-editor-body">
                <div>
                    <StyleCodeEditor
                        key={initialCode}
                        config={editorConfig}
                        header={
                            <>
                                <ConnectedTemplateSelector />
                                <ConnectedSaveStyleButton variant="primary" size="xs"/>
                            </>
                        }
                    />
                </div>
            </div>
            <Portal>
                <ResizableModal
                    title={<Message msgId="gnviewer.styleEditorCloseTitle"/>}
                    fitContent
                    clickOutEnabled={false}
                    show={closing}
                    onClose={() => {
                        setClosing(false);
                    }}
                    buttons={[
                        {
                            text: <Message msgId="gnviewer.styleEditorCloseCancel"/>,
                            onClick: () => {
                                setClosing(false);
                            }
                        },
                        {
                            text: <Message msgId="gnviewer.styleEditorCloseConfirm"/>,
                            bsStyle: 'primary',
                            onClick: () => {
                                setClosing(false);
                                handleClose(true);
                            }
                        }
                    ]}
                >
                    <div style={{ padding: '1rem' }}>
                        <Message msgId="gnviewer.styleEditorCloseMessage"/>
                    </div>
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
        initialCodeStyleSelector,
        state => state?.controls?.visualStyleEditor?.enabled,
        state => mapLayoutValuesSelector(state, { height: true }),
        getSelectedLayer,
        codeStyleSelector,
        getViewedResourceType
    ], (layer, temporaryStyleId, styleService, initialCode, enabled, style, originalLayer, code, resourceType) => ({
        layer,
        temporaryStyleId,
        styleService,
        initialCode,
        enabled,
        style,
        originalStyle: originalLayer?.style,
        isStyleChanged: initialCode !== undefined && code !== undefined && initialCode !== code,
        resourceType
    })),
    {
        onUpdateStatus: updateStatus,
        onUpdateParams: updateSettingsParams,
        onInit: initStyleService,
        onReset: toggleStyleEditor.bind(null, undefined, false),
        onSave: updateStyleCode,
        onClose: setControlProperty.bind(null, 'visualStyleEditor', 'enabled', false),
        onUpdateNode: updateNode
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
    onClick = () => {},
    enabled,
    isNew,
    btnProps = {},
    hide,
    selectedStyle
}) {

    if (!(!hide && status === 'LAYER' && layer?.extendedParams?.mapLayer && (enabled || isNew))) {
        return null;
    }

    function handleClick(event) {
        event.stopPropagation();
        event.preventDefault();
        onClick(layer, { style: selectedStyle });
    }
    function handleMouseDown(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    return (
        <Button
            variant="primary"
            className="square-button-md"
            {...btnProps}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            tooltipId={<Message msgId={`gnviewer.editLayerStyle`} />}
        >
            <Glyphicon glyph="dropper"/>
        </Button>
    );
}

const ConnectedStyleEditorTocButton = connect(createSelector([
    getUpdatedLayer,
    getResourcePerms,
    isNewResource
], (layer, perms, newMap) => ({
    layer,
    enabled: !!perms?.includes('change_resourcebase'),
    isNew: newMap
})), {
    onClick: requestDatasetAvailableStyles
})(StyleEditorTocButton);

export default createPlugin('VisualStyleEditor', {
    component: VisualStyleEditorPlugin,
    containers: {
        TOC: {
            target: 'toolbar',
            Component: ConnectedStyleEditorTocButton,
            position: 100
        },
        LayerSettings: {
            target: 'style-button',
            Component: ConnectedStyleEditorTocButton
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
