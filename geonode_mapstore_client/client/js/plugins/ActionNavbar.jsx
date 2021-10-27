/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import ActionNavbar from '@js/components/ActionNavbar';

import FaIcon from '@js/components/FaIcon';
import usePluginItems from '@js/hooks/usePluginItems';
import {
    getResourcePerms,
    canAddResource,
    getResourceData,
    getResourceDirtyState,
    getSelectedLayerPermissions
} from '@js/selectors/resource';
import { hasPermissionsTo, reduceArrayRecursive } from '@js/utils/MenuUtils';
import { getResourceTypesInfo } from '@js/utils/ResourceUtils';

function checkResourcePerms(menuItem, resourcePerms) {
    if (menuItem.disableIf) {
        return false;
    }
    if (menuItem.type && menuItem.perms) {
        return hasPermissionsTo(resourcePerms, menuItem.perms, 'resource');
    }
    return true;
}

function ActionNavbarPlugin({
    items,
    leftMenuItems,
    rightMenuItems,
    resourcePerms,
    resource,
    isDirtyState,
    selectedLayerPermissions
}, context) {

    const types = getResourceTypesInfo();
    const { icon } = types[resource?.resource_type] || {};
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins }, [resource?.pk, selectedLayerPermissions]);

    const leftMenuItemsPlugins = reduceArrayRecursive(leftMenuItems, (item) => {
        configuredItems.find(plugin => {
            if ( item.type === 'plugin' && plugin.name === item.name ) {
                item.Component = plugin?.Component;
            }
        });

        item.className = item.showPendingChangesIcon && isDirtyState ? 'gn-pending-changes-icon' : '';
        return (item);
    });

    const rightMenuItemsPlugins = reduceArrayRecursive(rightMenuItems, (item) => {
        configuredItems.find(plugin => {
            if ( item.type === 'plugin' && plugin.name === item.name ) {
                item.Component = plugin?.Component;
            }
        });
        return (item);
    });

    const leftItems = reduceArrayRecursive(
        leftMenuItemsPlugins,
        menuItem => checkResourcePerms(menuItem, resourcePerms)
    );

    const rightItems = reduceArrayRecursive(
        rightMenuItemsPlugins,
        menuItem => checkResourcePerms(menuItem, resourcePerms)
    );

    return (

        <ActionNavbar
            leftItems={leftItems}
            rightItems={rightItems}
            variant="default"
            size="sm"
        >
            <h1 className="gn-action-navbar-title">{icon && <FaIcon name={icon}/>}{'  '}{resource?.title}</h1>
        </ActionNavbar>
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
    createSelector([
        getResourcePerms,
        canAddResource,
        getResourceData,
        getResourceDirtyState,
        getSelectedLayerPermissions
    ], (resourcePerms, userCanAddResource, resource, dirtyState, selectedLayerPermissions) => ({
        resourcePerms: (resourcePerms.length > 0 ) ?
            resourcePerms : ((userCanAddResource)
                ? [ "change_resourcebase"] : [] ),
        resource,
        isDirtyState: !!dirtyState,
        selectedLayerPermissions
    }))
)(ActionNavbarPlugin);

export default createPlugin('ActionNavbar', {
    component: ConnectedActionNavbarPlugin,
    containers: {},
    epics: {},
    reducers: {}
});
