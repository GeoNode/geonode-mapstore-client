/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect, createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { createSelector } from 'reselect';
import ActionNavbar from '@js/components/ActionNavbar';

import usePluginItems from '@mapstore/framework/hooks/usePluginItems';
import {
    getResourcePerms,
    canAddResource,
    getResourceData,
    getResourceDirtyState,
    getSelectedLayerPermissions,
    isNewResource
} from '@js/selectors/resource';
import { hasPermissionsTo, reduceArrayRecursive } from '@js/utils/MenuUtils';

function checkResourcePerms(menuItem, resourcePerms) {
    if (menuItem.disableIf) {
        return false;
    }
    if (menuItem.type && menuItem.perms) {
        return hasPermissionsTo(resourcePerms, menuItem.perms, 'resource');
    }
    return true;
}

function ActionNavbarPlugin(
    {
        items,
        leftMenuItems,
        rightMenuItems,
        resourcePerms,
        resource,
        isDirtyState,
        selectedLayerPermissions,
        variant = 'primary'
    },
    context
) {
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins }, [
        resource?.pk,
        selectedLayerPermissions
    ]);

    const leftMenuItemsPlugins = reduceArrayRecursive(leftMenuItems, (item) => {
        configuredItems.find((plugin) => {
            if (item.type === 'plugin' && plugin.name === item.name) {
                item.Component = plugin?.Component;
            }
        });

        item.className =
            item.showPendingChangesIcon && isDirtyState
                ? 'gn-pending-changes-icon'
                : '';
        return item;
    });

    const rightMenuItemsPlugins = reduceArrayRecursive(
        rightMenuItems,
        (item) => {
            configuredItems.find((plugin) => {
                if (item.type === 'plugin' && plugin.name === item.name) {
                    item.Component = plugin?.Component;
                }
            });
            return item;
        }
    );

    const leftItems = reduceArrayRecursive(leftMenuItemsPlugins, (menuItem) =>
        checkResourcePerms(menuItem, resourcePerms)
    );

    const rightItems = reduceArrayRecursive(rightMenuItemsPlugins, (menuItem) =>
        checkResourcePerms(menuItem, resourcePerms)
    );

    useEffect(() => {
        // set the correct height of navbar
        const mainHeader = document.querySelector('.gn-main-header');
        const mainHeaderPlaceholder = document.querySelector('.gn-main-header-placeholder');
        const topbar = document.querySelector('#gn-topbar');
        function resize() {
            if (mainHeaderPlaceholder && mainHeader) {
                mainHeaderPlaceholder.style.height = mainHeader.clientHeight + 'px';
            }
            if (topbar && mainHeader) {
                topbar.style.top = mainHeader.clientHeight + 'px';
            }
        }
        // hide the navigation bar if a resource is being viewed
        document.getElementById('gn-topbar')?.classList.add('hide-navigation');
        document.getElementById('gn-brand-navbar-bottom')?.classList.add('hide-search-bar');
        resize();
        return () => {
            document.getElementById('gn-topbar')?.classList.remove('hide-navigation');
            document.getElementById('gn-brand-navbar-bottom')?.classList.remove('hide-search-bar');
            resize();
        };
    }, []);

    return (
        <ActionNavbar
            leftItems={leftItems}
            rightItems={rightItems}
            variant={variant}
            size="sm"
            resource={resource}
        />
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
            getResourcePerms,
            canAddResource,
            getResourceData,
            getResourceDirtyState,
            getSelectedLayerPermissions,
            isNewResource
        ],
        (
            resourcePerms,
            userCanAddResource,
            resource,
            dirtyState,
            selectedLayerPermissions,
            newResource
        ) => ({
            resourcePerms: resourcePerms.length > 0 ? resourcePerms : userCanAddResource ? ['change_resourcebase'] : [],
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
