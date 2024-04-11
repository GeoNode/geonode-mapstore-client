/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import isEmpty from 'lodash/isEmpty';
import { Glyphicon } from 'react-bootstrap';
import GNButton from '@js/components/Button';
import { updateNode, hideSettings, showSettings } from '@mapstore/framework/actions/layers';
import { groupsSelector, elementSelector } from '@mapstore/framework/selectors/layers';
import { mapSelector } from '@mapstore/framework/selectors/map';
import { currentLocaleSelector, currentLocaleLanguageSelector } from '@mapstore/framework/selectors/locale';
import Message from '@mapstore/framework/components/I18N/Message';
import { mapLayoutValuesSelector } from '@mapstore/framework/selectors/maplayout';
import { getTitle } from '@mapstore/framework/utils/LayersUtils';
import GroupSettings from '@js/plugins/layersettings/GroupSettings';
import BaseLayerSettings from '@js/plugins/layersettings/BaseLayerSettings';
import WMSLayerSettings from '@js/plugins/layersettings/WMSLayerSettings';
import GeoNodeStyleSelector from '@js/plugins/layersettings/GeoNodeStyleSelector';
import usePluginItems from '@js/hooks/usePluginItems';
import layersettingsEpics from '@js/epics/layersettings';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { isAnnotationLayer } from '@mapstore/framework/plugins/Annotations/utils/AnnotationsUtils';

const Button = tooltip(GNButton);

const settingsForms = {
    group: GroupSettings,
    baseLayer: BaseLayerSettings,
    wms: WMSLayerSettings
};

const ConnectedGeoNodeStyleSelector = connect(
    createSelector([], () => ({})),
    {}
)(GeoNodeStyleSelector);

/*
 * Plugin for layer and groups settings
 * @name LayerSettings
 * @example
 */
function LayerSettings({
    node,
    onChange,
    style,
    selectedNodes,
    onClose,
    items = [],
    ...props
}, context) {


    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });

    if (isEmpty(node)) {
        return null;
    }

    const isGroup = !!node?.nodes;

    const Settings = isGroup
        ? settingsForms.group
        : settingsForms[node?.type] || settingsForms.baseLayer;

    const title = node?.title && getTitle(node.title, props.currentLocale) || node.name;

    function handleChange(properties) {
        onChange(node.id, isGroup ? 'groups' : 'layers', properties);
    }

    return (
        <div
            className="gn-layer-settings"
            style={style}
        >
            <div className="gn-layer-settings-head">
                <div className="gn-layer-settings-title">{title}</div>
                <Button className="square-button" onClick={() => onClose()}>
                    <Glyphicon glyph="1-close"/>
                </Button>
            </div>
            <div className="gn-layer-settings-body">
                <Settings
                    {...props}
                    node={node}
                    onChange={handleChange}
                    styleSelectorComponent={<ConnectedGeoNodeStyleSelector
                        {...props}
                        node={node}
                        onChange={handleChange}
                        buttons={(configuredItems || []).filter(({ target }) => target === 'style-button')}
                    />}
                />
            </div>
        </div>
    );
}

const ConnectedLayerSettings = connect(
    createSelector([
        elementSelector,
        mapSelector,
        groupsSelector,
        currentLocaleSelector,
        currentLocaleLanguageSelector,
        state => mapLayoutValuesSelector(state, { height: true }),
        elementSelector
    ], (node, map, groups, currentLocale, currentLocaleLanguage, style) => ({
        node,
        zoom: map?.zoom,
        projection: map?.projection,
        groups,
        currentLocale,
        currentLocaleLanguage,
        style
    })),
    {
        onChange: updateNode,
        onClose: hideSettings
    }
)(LayerSettings);

function LayerSettingsButton({
    status,
    statusTypes,
    nodeTypes,
    selectedNodes,
    onSettings = () =>  {},
    onHideSettings = () => {}
}) {

    const { node } = selectedNodes?.[0] || {};

    if (!(status === statusTypes.LAYER || status === statusTypes.GROUP)
    // hide default settings for annotation layer
    || (status === statusTypes.LAYER && isAnnotationLayer(node))) {
        return null;
    }

    function handleClick() {

        if (status === statusTypes.LAYER) {
            return onSettings(node.id, nodeTypes.LAYER, { opacity: parseFloat(node.opacity !== undefined ? node.opacity : 1) });
        }
        if (status === statusTypes.GROUP) {
            return onSettings(node.id, nodeTypes.GROUP, {});
        }
        return onHideSettings();
    }

    return (
        <Button
            variant="primary"
            className="square-button-md"
            onClick={handleClick}
            tooltipId={<Message msgId={`toc.toolLayerSettingsTooltip`} />}
        >
            <Glyphicon glyph="wrench"/>
        </Button>
    );
}

const ConnectedLayerSettingsButton = connect(
    createSelector([], () => ({})),
    {
        onSettings: showSettings,
        onHideSettings: hideSettings
    }
)(LayerSettingsButton);


export default createPlugin('LayerSettings', {
    component: ConnectedLayerSettings,
    containers: {
        TOC: {
            target: 'toolbar',
            Component: ConnectedLayerSettingsButton,
            position: 5
        }
    },
    epics: {
        ...layersettingsEpics
    },
    reducers: {}
});
