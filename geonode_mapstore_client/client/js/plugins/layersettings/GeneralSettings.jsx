/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import uniqBy from 'lodash/uniqBy';
import { ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Select from 'react-select';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';
import { isValidNewGroupOption, getLabelName as _getLabelName } from '@mapstore/framework/plugins/TOC/utils/TOCUtils';
import { getTitle as _getTitle, flattenGroups } from '@mapstore/framework/utils/LayersUtils';
function SelectGroup({
    node,
    allowNew = false,
    groups: groupsProp,
    currentLocale,
    onChange
}) {

    const SelectCreatable = allowNew ? Select.Creatable : Select;
    const getTitle = (label) => _getTitle(label, currentLocale);
    const getLabelName = (label, groups) => _getLabelName(getTitle(label), groups);
    const findGroupLabel = () => {
        const wholeGroups = groupsProp && flattenGroups(groupsProp, 0, true);
        const eleGroupName = node?.group || 'Default';
        const group = wholeGroups.find(gr => gr.id === eleGroupName) || {};
        return getTitle(group.title);
    };
    const groups = groupsProp && flattenGroups(groupsProp);
    const nodeGroupLabel = findGroupLabel();

    return (
        <SelectCreatable
            clearable={false}
            key="group-dropdown"
            options={
                uniqBy([
                    { value: 'Default', label: 'Default' },
                    ...(groups || node?.group || []).map(item => {
                        if (isObject(item)) {
                            return {...item, label: getLabelName(item.label, groups)};
                        }
                        return { label: getLabelName(item, groups), value: item };
                    })
                ], 'value')
            }
            isValidNewOption={isValidNewGroupOption}
            newOptionCreator={function(option) {
                const { valueKey, label, labelKey } = option;
                const value = label.replace(/\./g, '${dot}').replace(/\//g, '.');
                return {
                    [valueKey]: value,
                    [labelKey]: label,
                    className: 'Select-create-option-placeholder'
                };
            }}
            value={{ label: getLabelName(nodeGroupLabel, groups), value: nodeGroupLabel}}
            placeholder={getLabelName(nodeGroupLabel, groups)}
            onChange={({ value }) => onChange({ group: value || 'Default' })}
        />
    );
}

function GeneralSettings({
    node = {},
    nodeType,
    showTooltipOptions = true,
    onChange = () => {},
    groups,
    currentLocale
}, context) {

    function  handleUpdateTranslation(key, event) {
        const title = (key === 'default' && isString(node.title))
            ? event.target.value
            : {
                ...(isObject(node.title)
                    ? node.title
                    : { 'default': node.title || '' }),
                [key]: event.target.value
            };
        onChange({ title });
    }

    const tooltipItems = [
        { value: "title", label: getMessageById(context.messages, "layerProperties.tooltip.title") },
        { value: "description", label: getMessageById(context.messages, "layerProperties.tooltip.description") },
        { value: "both", label: getMessageById(context.messages, "layerProperties.tooltip.both") },
        { value: "none", label: getMessageById(context.messages, "layerProperties.tooltip.none") }
    ];
    const tooltipPlacementItems = [
        { value: "top", label: getMessageById(context.messages, "layerProperties.tooltip.top") },
        { value: "right", label: getMessageById(context.messages, "layerProperties.tooltip.right") },
        { value: "bottom", label: getMessageById(context.messages, "layerProperties.tooltip.bottom") }
    ];

    const {
        title,
        description = '',
        tooltipOptions = 'title',
        tooltipPlacement = 'top'
    } = node || {};

    const currentTitle = isString(title) ? title : _getTitle(title, currentLocale) ?? title?.default ?? '';

    return (
        <>
            <FormGroup>
                <ControlLabel><Message msgId="layerProperties.title" /></ControlLabel>
                <FormControl
                    defaultValue={currentTitle}
                    key="title"
                    type="text"
                    onBlur={handleUpdateTranslation.bind(null, 'default')} />
            </FormGroup>
            <FormGroup>
                <ControlLabel><Message msgId="layerProperties.description" /></ControlLabel>
                <FormControl
                    defaultValue={description}
                    key="description"
                    type="text"
                    onBlur={(event) => onChange({ description: event.target.value })}/>
            </FormGroup>
            {nodeType === 'layer'
                ? <FormGroup>
                    <ControlLabel><Message msgId="layerProperties.group" /></ControlLabel>
                    <SelectGroup
                        node={node}
                        onChange={onChange}
                        groups={groups}
                        currentLocale={currentLocale}
                    />
                </FormGroup>
                : null}
            {showTooltipOptions &&
            <>
                <FormGroup>
                    <ControlLabel><Message msgId="gnviewer.nodeTooltipContent" /></ControlLabel>
                    <Select
                        clearable={false}
                        key="tooltips-dropdown"
                        options={tooltipItems}
                        value={tooltipItems.find(({ value }) => value === tooltipOptions)}
                        onChange={({ value }) => onChange({ tooltipOptions: value || 'title' })}
                    />
                </FormGroup>
                <FormGroup>
                    <ControlLabel><Message msgId="gnviewer.nodeTooltipPlacement" /></ControlLabel>
                    <Select
                        clearable={false}
                        key="tooltips-placement-dropdown"
                        options={tooltipPlacementItems}
                        value={tooltipPlacementItems.find(({ value }) => value === tooltipPlacement)}
                        onChange={({ value }) => onChange({ tooltipPlacement: value || 'top' })}
                    />
                </FormGroup>
            </>}

        </>
    );
}

GeneralSettings.contextTypes = {
    messages: PropTypes.object
};

export default GeneralSettings;
