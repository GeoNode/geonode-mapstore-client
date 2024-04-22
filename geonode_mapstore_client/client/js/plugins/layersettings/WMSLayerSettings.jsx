/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef } from 'react';
import isNumber from 'lodash/isNumber';
import clamp from 'lodash/clamp';
import { Glyphicon, FormGroup, ControlLabel, Checkbox } from 'react-bootstrap';
import Button from '@js/components/Button';
import IntlNumberFormControl from '@mapstore/framework/components/I18N/IntlNumberFormControl';
import Message from '@mapstore/framework/components/I18N/Message';
import InfoPopover from '@mapstore/framework/components/widgets/widget/InfoPopover';
import { getSupportedFormat } from '@mapstore/framework/api/WMS';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import LegendImage from '@mapstore/framework/plugins/TOC/components/Legend';
import { DEFAULT_SUPPORTED_GET_MAP_FORMAT } from '@mapstore/framework/utils/WMSUtils';
import Select from 'react-select';
import GeneralSettings from '@js/plugins/layersettings/GeneralSettings';
import VisibilitySettings from '@js/plugins/layersettings/VisibilitySettings';
import SettingsSection from '@js/plugins/layersettings/SettingsSection';
import useLocalStorage from '@js/hooks/useLocalStorage';

function WMSLayerSettings({
    node = {},
    resolutions,
    projection,
    onChange = () => {},
    zoom,
    formats,
    isLocalizedLayerStylesEnabled,
    currentLocaleLanguage,
    groups = [],
    currentLocale,
    styleSelectorComponent
}) {

    const {
        singleTile = false,
        tiled = true,
        transparent = true,
        localizedLayerStyles = false,
        imageFormats,
        format = getConfigProp('defaultLayerFormat') || 'image/png',
        url,
        legendOptions = {
            legendWidth: 12,
            legendHeight: 12
        }
    } = node;

    const [formatLoading, setFormatLoading] = useState();
    const [settingsSections, setSettingsSections] = useLocalStorage('settings-section', {
        general: true,
        visibility: false,
        style: false,
        tiling: false
    });
    function handleChangeSection(key, value) {
        setSettingsSections({
            ...settingsSections,
            [key]: value
        });
    }

    const isMounted = useRef();
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    function handleFormatOptionsFetch(layerUrl) {
        if (!formatLoading) {
            setFormatLoading(true);
            getSupportedFormat(layerUrl)
                .then((newImageFormats)=>{
                    if (isMounted.current) {
                        onChange({ imageFormats: newImageFormats });
                        setFormatLoading(false);
                    }
                })
                .catch(() => {
                    if (isMounted.current) {
                        setFormatLoading(false);
                    }
                });
        }
    }

    function isLegendOptionValid(propertyKey) {
        if (legendOptions && legendOptions[propertyKey]) {
            return parseInt(legendOptions[propertyKey], 10) < 12 ? 'error' : null;
        }
        return null;
    }
    function areLegendOptionsValid() {
        return isLegendOptionValid('legendWidth') !== 'error' &&
        isLegendOptionValid('legendHeight') !== 'error' &&
        isNumber(legendOptions.legendHeight) &&
        isNumber(legendOptions.legendWidth);
    }
    function handleLegendOptionBlur(event) {
        const value = event.target.value && Math.round(event.target.value);
        const name = event.target.name;
        const defaultSize = 12;
        onChange({
            legendOptions: {
                ...legendOptions,
                [name]: value >= defaultSize ? value : ''
            }
        });
    }

    return (
        <>
            <SettingsSection
                title={<Message msgId="gnviewer.generalSettings" />}
                expanded={settingsSections?.general}
                onChange={handleChangeSection.bind(null, 'general')}
            >
                <GeneralSettings
                    node={node}
                    onChange={onChange}
                    nodeType="layer"
                    groups={groups}
                    currentLocale={currentLocale}
                />
            </SettingsSection>


            <SettingsSection
                title={<Message msgId="gnviewer.visibilitySettings" />}
                expanded={settingsSections?.visibility}
                onChange={handleChangeSection.bind(null, 'visibility')}
            >
                <VisibilitySettings
                    node={node}
                    resolutions={resolutions}
                    projection={projection}
                    onChange={onChange}
                    zoom={zoom}
                />
            </SettingsSection>
            <SettingsSection
                title={<Message msgId="gnviewer.styleSettings" />}
                expanded={settingsSections?.style}
                onChange={handleChangeSection.bind(null, 'style')}
            >
                {styleSelectorComponent}
                <FormGroup validationState={isLegendOptionValid('legendWidth')}>
                    <ControlLabel><Message msgId="gnviewer.legendWidth" /></ControlLabel>
                    <IntlNumberFormControl
                        value={legendOptions.legendWidth}
                        name="legendWidth"
                        type="number"
                        min={12}
                        max={1000}
                        onChange={(value)=> onChange({ legendOptions: { ...legendOptions, legendWidth: value && clamp(Math.round(value), 0, 1000) } })}
                        onKeyPress={(event)=> event.key === '-' && event.preventDefault()}
                        onBlur={handleLegendOptionBlur}
                    />
                </FormGroup>
                <FormGroup
                    validationState={isLegendOptionValid('legendHeight')}
                >
                    <ControlLabel><Message msgId="gnviewer.legendHeight" /></ControlLabel>
                    <IntlNumberFormControl
                        value={legendOptions.legendHeight}
                        name="legendHeight"
                        type="number"
                        min={12}
                        max={1000}
                        onChange={(value)=> onChange({ legendOptions: { ...legendOptions, legendHeight: value && clamp(Math.round(value), 0, 1000) } })}
                        onKeyPress={(event)=> event.key === '-' && event.preventDefault()}
                        onBlur={handleLegendOptionBlur}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel><Message msgId="gnviewer.legendPreview" /></ControlLabel>
                    <div style={{ width: '100%', overflow: 'auto' }}>
                        <LegendImage
                            style={{ maxWidth: 'none' }}
                            layer={node}
                            legendHeight={
                                areLegendOptionsValid() && legendOptions.legendHeight || undefined}
                            legendWidth={
                                areLegendOptionsValid() && legendOptions.legendWidth || undefined}
                            language={
                                isLocalizedLayerStylesEnabled ? currentLocaleLanguage : undefined}
                        />
                    </div>
                </FormGroup>
            </SettingsSection>
            <SettingsSection
                title={<Message msgId="gnviewer.tilingSettings" />}
                expanded={settingsSections?.tiling}
                onChange={handleChangeSection.bind(null, 'tiling')}
            >
                <FormGroup>
                    <ControlLabel><Message msgId="layerProperties.format.title" /></ControlLabel>
                    <div className={'ms-format-container'}>
                        <Select
                            className={'format-select'}
                            key="format-dropdown"
                            clearable={false}
                            noResultsText={<Message
                                msgId={formatLoading
                                    ? "layerProperties.format.loading"
                                    : "layerProperties.format.noOption"}
                            />}
                            isLoading={!!formatLoading}
                            options={formatLoading
                                ? []
                                : (formats ?? imageFormats ?? DEFAULT_SUPPORTED_GET_MAP_FORMAT).map((_format) => _format?.value ? _format : ({ value: _format, label: _format }))
                            }
                            value={format}
                            onChange={({ value }) => onChange({ format: value })}/>
                        <Button
                            tooltipId="layerProperties.format.refresh"
                            className="square-button-md no-border format-refresh"
                            onClick={() => handleFormatOptionsFetch(url)}
                            key="format-refresh">
                            <Glyphicon glyph="refresh" />
                        </Button>
                    </div>
                </FormGroup>
                <FormGroup>
                    <ControlLabel>Size</ControlLabel>
                    <Select
                        key="wsm-layersize-dropdown"
                        clearable={false}
                        options={[{ value: 256, label: 256 }, { value: 512, label: 512 }]}
                        value={node?.tileSize || 256}
                        onChange={({ value }) => onChange({ tileSize: value })}/>
                </FormGroup>
                <FormGroup>
                    <Checkbox
                        key="transparent"
                        checked={transparent}
                        onChange={(event) => onChange({ transparent: event.target.checked })}
                    >
                        <Message msgId="layerProperties.transparent"/>
                    </Checkbox>
                    <Checkbox
                        value="tiled"
                        key="tiled"
                        disabled={!!singleTile}
                        onChange={(event) => onChange({ tiled: event.target.checked })}
                        checked={tiled} >
                        <Message msgId="layerProperties.cached"/>
                    </Checkbox>
                    <Checkbox
                        key="singleTile"
                        value="singleTile"
                        checked={singleTile}
                        onChange={(event) => onChange({ singleTile: event.target.checked })}>
                        <Message msgId="layerProperties.singleTile"/>
                    </Checkbox>
                    {(isLocalizedLayerStylesEnabled ? (
                        <Checkbox
                            key="localizedLayerStyles"
                            value="localizedLayerStyles"
                            data-qa="display-lacalized-layer-styles-option"
                            checked={localizedLayerStyles}
                            onChange={(event) => onChange({ localizedLayerStyles: event.target.checked })}>
                            <Message msgId="layerProperties.enableLocalizedLayerStyles.label" />&nbsp;
                            <InfoPopover text={<Message msgId="layerProperties.enableLocalizedLayerStyles.tooltip" />} />
                        </Checkbox>) : null)}
                </FormGroup>
            </SettingsSection>
        </>
    );
}

export default WMSLayerSettings;
