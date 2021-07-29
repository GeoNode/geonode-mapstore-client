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
import usePluginItems from '@js/hooks/usePluginItems';
import { getResourcePerms, canAddResource } from '@js/selectors/resource';
import { hasPermissionsTo, reduceArrayRecursive } from '@js/utils/MenuUtils';

function checkResourcePerms(menuItem, resourcePerms) {
    if (menuItem.type && menuItem.perms) {
        return hasPermissionsTo(resourcePerms, menuItem.perms, 'resource');
    }
    return true;
}

function ActionNavbarPlugin({
    items,
    leftMenuItems,
    resourcePerms
}, context) {

    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });

    const leftMenuItemsPlugins = reduceArrayRecursive(leftMenuItems, (item) => {
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
    return (

        <ActionNavbar
            leftItems={leftItems}
            variant="default"
            size="sm"
        />
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
        canAddResource
    ], (resourcePerms, userCanAddResource) => ({
        resourcePerms: (resourcePerms.length > 0 ) ?
            resourcePerms : ((userCanAddResource)
                ? [ "change_resourcebase"] : [] )
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
