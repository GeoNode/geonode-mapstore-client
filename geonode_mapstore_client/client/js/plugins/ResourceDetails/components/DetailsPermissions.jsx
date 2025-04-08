/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { createSelector } from "reselect";
import findIndex from "lodash/findIndex";

import PermissionsComponent from "@mapstore/framework/plugins/ResourcesCatalog/components/Permissions";
import useIsMounted from "@mapstore/framework/hooks/useIsMounted";

import {
    getGroups,
    getResourceTypes,
    getUsers
} from "@js/api/geonode/v2";
import { updateResourceCompactPermissions } from "@js/actions/gnresource";
import {
    getCompactPermissions,
    getViewedResourceType
} from "@js/selectors/resource";
import { getCurrentResourcePermissionsLoading } from "@js/selectors/resourceservice";
import {
    availableResourceTypes,
    getResourcePermissions,
    permissionsCompactToLists,
    permissionsListsToCompact,
    resourceToPermissionEntry,
    ResourceTypes
} from "@js/utils/ResourceUtils";
import GeoLimits from "@js/components/Permissions/GeoLimits";

const entriesTabs = [
    {
        id: "user",
        labelId: "gnviewer.users",
        request: ({ entries, groups, ...params }) => {
            const exclude = entries
                .filter(({ type }) => type === "user")
                .map(({ id }) => id);
            return getUsers({
                ...params,
                "filter{-pk.in}": [...exclude, -1],
                "filter{is_superuser}": false
            });
        },
        responseToEntries: ({ response, entries }) => {
            return response?.users.map((user) => {
                const { permissions } =
          entries.find((entry) => entry.id === user.pk) || {};
                return {
                    ...resourceToPermissionEntry("user", user),
                    permissions
                };
            });
        }
    },
    {
        id: "group",
        labelId: "gnviewer.groups",
        request: ({ entries, groups, ...params }) => {
            const excludeEntries = entries
                .filter(({ type }) => type === "group")
                .map(({ id }) => id);
            const excludeGroups = groups.map(({ id }) => id);
            const exclude = [...(excludeEntries || []), ...(excludeGroups || [])];
            return getGroups({
                ...params,
                "filter{-group.pk.in}": exclude
            });
        },
        responseToEntries: ({ response, entries }) => {
            return response?.groups.map((group) => {
                const { permissions } =
          entries.find((entry) => entry.id === group.group.pk) || {};
                return {
                    ...resourceToPermissionEntry("group", group),
                    permissions
                };
            });
        }
    }
];


const Permissions = ({
    resourceType,
    permissionsLoading,
    compactPermissions,
    onChangePermissions
}) => {
    const enableGeoLimits = resourceType === ResourceTypes.DATASET;
    const isMounted = useIsMounted();
    const [permissionsObject, setPermissionsObject] = useState({});

    useEffect(() => {
        getResourceTypes().then((data) => {
            const resourceIndex = findIndex(data, { name: resourceType });
            let responseOptions;
            if (resourceIndex !== -1) {
                responseOptions = getResourcePermissions(
                    data[resourceIndex].allowed_perms.compact
                );
            } else {
                // set a default permission object
                responseOptions = getResourcePermissions(data[0].allowed_perms.compact);
            }
            isMounted(() => setPermissionsObject(responseOptions));
        });
    }, [availableResourceTypes]);
    return (
        <PermissionsComponent
            editing
            compactPermissions={permissionsCompactToLists(compactPermissions)}
            entriesTabs={entriesTabs}
            onChange={(value) =>
                onChangePermissions(permissionsListsToCompact(value))
            }
            showGroupsPermissions
            tools={
                enableGeoLimits
                    ? [{ Component: GeoLimits, name: "GeoLimits" }]
                    : []
            }
            loading={permissionsLoading}
            permissionOptions={permissionsObject}
        />
    );
};

export default connect(
    createSelector(
        [
            getCompactPermissions,
            getCurrentResourcePermissionsLoading,
            getViewedResourceType
        ],
        (compactPermissions, permissionsLoading, type) => ({
            compactPermissions,
            permissionsLoading,
            resourceType: type
        })
    ),
    {
        onChangePermissions: updateResourceCompactPermissions
    }
)(Permissions);
