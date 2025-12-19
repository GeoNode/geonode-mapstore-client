/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { userSelector } from '@mapstore/framework/selectors/security';
import { getResources } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';

import { startAsyncProcess } from '@js/actions/resourceservice';
import { extractExecutionsFromResources, ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { getResourceData } from '@js/selectors/resource';
import isEmpty from 'lodash/isEmpty';
import { getCurrentProcesses } from '@js/selectors/resourceservice';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';

/**
 * Plugin that monitors async executions embedded in resources and
 * triggers the executions API using the existing resourceservice epics.
 *
 * It reads `resources[*].executions` and, when it finds executions and,
 * dispatches `startAsyncProcess({ resource, output, processType })` once per execution.
 *
 */
function ExecutionTracker({
    resources,
    user,
    onStartAsyncProcess,
    resourceData,
    processes
}) {
    const startedKeys = useRef(new Set());
    const redirected = useRef(false);

    useEffect(() => {
        const username = user?.info?.preferred_username;
        const resourcesToTrack = !isEmpty(resourceData) ? [...resources, resourceData] : resources;
        if (!resourcesToTrack?.length || !username) {
            return;
        }
        const executions = extractExecutionsFromResources(resourcesToTrack, username) || [];
        if (!executions.length) {
            return;
        }
        executions.forEach((process) => {
            const pk = process?.resource?.pk ?? process?.resource?.id;
            const processType = process?.processType;
            const statusUrl = process?.output?.status_url;
            if (!pk || !processType || !statusUrl) {
                return;
            }
            const key = `${pk}:${processType}:${statusUrl}`;
            if (!startedKeys.current.has(key)) {
                startedKeys.current.add(key);
                onStartAsyncProcess(process);
            }
        });
    }, [resources, user, onStartAsyncProcess, resourceData]);

    useEffect(() => {
        if (redirected.current) {
            return;
        }
        const resourcePk = resourceData?.pk ?? resourceData?.id;
        if (!resourcePk) {
            return;
        }
        const clonedResourceUrl = (processes || [])
            .find((p) => p?.resource?.pk === resourcePk && !!p?.clonedResourceUrl)
            ?.clonedResourceUrl;

        if (clonedResourceUrl && window?.location?.href !== clonedResourceUrl) {
            redirected.current = true;
            window.location.assign(clonedResourceUrl);
        }
    }, [processes, resourceData]);

    const msgId = useMemo(() => {
        if (isEmpty(resourceData)) {
            return null;
        }
        const resourcePk = resourceData?.pk ?? resourceData?.id;
        if (!resourcePk) {
            return null;
        }
        const foundProcess = processes.filter((p) => p?.resource?.pk === resourcePk);
        if (!foundProcess?.length) {
            return null;
        }
        const copying = foundProcess.some((p) => [ProcessTypes.COPY_RESOURCE, 'copy', 'copy_geonode_resource'].includes(p?.processType));
        const deleting = foundProcess.some((p) => [ProcessTypes.DELETE_RESOURCE, 'delete'].includes(p?.processType));
        if (copying) {
            return 'gnviewer.cloning';
        }
        if (deleting) {
            return 'gnviewer.deleting';
        }
        return null;
    }, [processes, resourceData]);

    return msgId ? (
        <div className="gn-execution-tracker">
            <FlexBox centerChildren gap="sm" className="ms-text _font-size-lg _strong">
                <Spinner />
                <Message msgId={msgId} />
            </FlexBox>
        </div>
    ) : null;
}

const ExecutionTrackerPlugin = connect(
    createSelector(
        [
            (state) => getResources(state, { id: 'catalog' }),
            userSelector,
            getResourceData,
            getCurrentProcesses
        ],
        (resources, user, resourceData, processes) => ({
            resources,
            user,
            resourceData,
            processes
        })
    ),
    {
        onStartAsyncProcess: startAsyncProcess
    }
)(ExecutionTracker);

export default createPlugin('ExecutionTracker', {
    component: ExecutionTrackerPlugin
});
