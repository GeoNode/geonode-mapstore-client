/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect, createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { createSelector } from 'reselect';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import usePluginItems from '@mapstore/framework/hooks/usePluginItems';
import {
    getResourceData,
    getResourceDirtyState,
    getSelectedLayerPermissions,
    isNewResource
} from '@js/selectors/resource';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import Button from '@mapstore/framework/components/layout/Button';
import Menu from '@mapstore/framework/plugins/ResourcesCatalog/components/Menu';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';

const ButtonWithTooltip = tooltip(Button);

function ActionNavbarMenuItem({
    className,
    loading,
    glyph,
    iconType,
    labelId,
    onClick
}) {
    return (
        <li>
            <ButtonWithTooltip
                square
                borderTransparent
                tooltipId={labelId}
                tooltipPosition="bottom"
                onClick={onClick}
                className={className}
            >
                {loading ? <Spinner /> : <Icon glyph={glyph} type={iconType} />}
            </ButtonWithTooltip>
        </li>
    );
}

ActionNavbarMenuItem.propTypes = {
    className: PropTypes.string,
    loading: PropTypes.bool,
    glyph: PropTypes.string,
    iconType: PropTypes.string,
    labelId: PropTypes.string,
    onClick: PropTypes.func
};

ActionNavbarMenuItem.defaultProps = {
    iconType: 'glyphicon',
    onClick: () => {}
};

const recursiveFilter = (value, filterFunc) => {
    if (isArray(value)) {
        return value.map(val => recursiveFilter(val, filterFunc)).filter(val => val !== undefined);
    }
    if (isObject(value)) {
        return filterFunc(value) ? Object.keys(value).reduce((acc, key) => {
            return {
                ...acc,
                [key]: recursiveFilter(value[key], filterFunc)
            };
        }, {}) : undefined;
    }
    return value;
};

const recursiveUpdate = (entry, updateFunc) => {
    return updateFunc(entry.id, entry.items)
        .map((menuItem) => {
            if (menuItem.items) {
                return {
                    ...menuItem,
                    items: recursiveUpdate(menuItem, updateFunc)
                };
            }
            return menuItem;
        });
};

function ActionNavbarPlugin(
    {
        items,
        leftMenuItems: leftMenuItemsProp,
        rightMenuItems: rightMenuItemsProp,
        resource,
        isDirtyState,
        selectedLayerPermissions,
        variant,
        size
    },
    context
) {
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins }, [
        resource?.pk,
        selectedLayerPermissions
    ]);
    const filterFunc = item => !item.disableIf;
    const rootMenuId = '#root';
    const pluginNoTargetMenuItems = configuredItems.filter(({ target }) => !target);
    const pluginLeftMenuItems = configuredItems.filter(({ target }) => target === 'left-menu').map(plugin => ({ ...plugin, targetMenuId: plugin.targetMenuId || rootMenuId }));
    const pluginRightMenuItems = configuredItems.filter(({ target }) => target === 'right-menu').map(plugin => ({ ...plugin, targetMenuId: plugin.targetMenuId || rootMenuId }));
    const updateMenu = (pluginsMenuItems) => (id, menuItems) => {
        const parsedMenuItems = menuItems
            .map((menuItem) => {
                if (menuItem.type === 'plugin') {
                    return pluginNoTargetMenuItems.find(plugin => plugin.name === menuItem.name);
                }
                return menuItem;
            })
            .filter(menuItem => menuItem)
            .map((menuItem, idx) => {
                return {
                    ...menuItem,
                    position: menuItem.position ?? (idx + 1) * 10,
                    ...(menuItem.showPendingChangesIcon && isDirtyState && { className: 'ms-notification-circle warning' })
                };
            });
        return [ ...pluginsMenuItems.filter(({ targetMenuId }) => targetMenuId === id), ...parsedMenuItems].sort((a, b) => a.position - b.position);
    };
    const leftMenuItems = recursiveUpdate({ id: rootMenuId, items: recursiveFilter(leftMenuItemsProp, filterFunc) }, updateMenu(pluginLeftMenuItems));
    const rightMenuItems = recursiveUpdate({ id: rootMenuId, items: recursiveFilter(rightMenuItemsProp, filterFunc) }, updateMenu(pluginRightMenuItems));

    return (
        <FlexBox
            id="ms-action-navbar"
            classNames={[
                'ms-action-navbar',
                'ms-main-colors',
                'shadow-md',
                '_sticky',
                '_corner-tl',
                '_padding-lr-md',
                '_padding-tb-xs',
                '_border-transparent'
            ]}
            centerChildrenVertically
            gap="sm"
        >
            <FlexBox.Fill
                component={Menu}
                centerChildrenVertically
                gap="xs"
                size={size}
                variant={variant}
                menuItemComponent={ActionNavbarMenuItem}
                items={leftMenuItems}
                wrap
            />
            <Menu
                centerChildrenVertically
                gap="xs"
                variant={variant}
                alignRight
                size={size}
                menuItemComponent={ActionNavbarMenuItem}
                items={rightMenuItems}
            />
        </FlexBox>
    );
}

ActionNavbarPlugin.propTypes = {
    items: PropTypes.array,
    leftMenuItems: PropTypes.array,
    rightMenuItems: PropTypes.array
};

ActionNavbarPlugin.defaultProps = {
    items: [],
    leftMenuItems: [],
    rightMenuItems: []
};

const ConnectedActionNavbarPlugin = connect(
    createSelector(
        [
            getResourceData,
            getResourceDirtyState,
            getSelectedLayerPermissions,
            isNewResource
        ],
        (
            resource,
            dirtyState,
            selectedLayerPermissions,
            newResource
        ) => ({
            resource,
            isDirtyState: !!dirtyState,
            selectedLayerPermissions,
            disableTitle: newResource
        })
    )
)(ActionNavbarPlugin);

export default createPlugin('ActionNavbar', {
    component: ConnectedActionNavbarPlugin,
    containers: {},
    epics: {},
    reducers: {}
});
