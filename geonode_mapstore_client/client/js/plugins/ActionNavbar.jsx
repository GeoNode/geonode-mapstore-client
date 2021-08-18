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
    getResourceDirtyState
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
    resourcePerms,
    resource,
    isDirtyState
}, context) {

    const types = getResourceTypesInfo();
    const { icon } = types[resource?.resource_type] || {};
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });

    const leftMenuItemsPlugins = reduceArrayRecursive(leftMenuItems, (item) => {
        configuredItems.find(plugin => {
            if ( item.type === 'plugin' && plugin.name === item.name ) {
                item.Component = plugin?.Component;
            }
        });

        item.className = item.showSaveStatus && isDirtyState ? 'gn-show-save-status' : '';
        return (item);
    });

    const leftItems = reduceArrayRecursive(
        leftMenuItemsPlugins,
        menuItem => checkResourcePerms(menuItem, resourcePerms)
    );

    return (

        <ActionNavbar
            leftItems={leftItems}
            variant="default"
            size="sm"
        >
            <h1 className="gn-action-navbar-title">{icon && <FaIcon name={icon}/>}{'  '}{resource?.title}</h1>
        </ActionNavbar>
    );
}

ActionNavbarPlugin.propTypes = {
    items: PropTypes.array,
    leftMenuItems: PropTypes.array
};

ActionNavbarPlugin.defaultProps = {
    items: [],
    leftMenuItems: []
};

const ConnectedActionNavbarPlugin = connect(
    createSelector([
        getResourcePerms,
        canAddResource,
        getResourceData,
        getResourceDirtyState
    ], (resourcePerms, userCanAddResource, resource, dirtyState) => ({
        resourcePerms: (resourcePerms.length > 0 ) ?
            resourcePerms : ((userCanAddResource)
                ? [ "change_resourcebase"] : [] ),
        resource,
        isDirtyState: !!dirtyState
    }))
)(ActionNavbarPlugin);

export default createPlugin('ActionNavbar', {
    component: ConnectedActionNavbarPlugin,
    containers: {
        ViewerLayout: {
            priority: 1,
            target: 'header'
        }
    },
    epics: {},
    reducers: {}
});
