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

import { startAsyncProcess } from '@js/actions/resourceservice';
import { extractExecutionsFromResources, ProcessStatus, ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { getResourceData } from '@js/selectors/resource';
import isEmpty from 'lodash/isEmpty';
import { getCurrentProcesses } from '@js/selectors/resourceservice';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import Message from '@mapstore/framework/components/I18N/Message';
import { getUploadErrorMessageFromCode } from '@js/utils/ErrorUtils';
import { error } from '@mapstore/framework/actions/notifications';

/**
* @module ExecutionTracker
*/

/**
 * Plugin that monitors async executions embedded in resources and
 * triggers the executions API using the existing resourceservice epics.
 *
 * It reads `resources[*].executions` checks for the executions, if found it
 * dispatches `startAsyncProcess({ resource, output, processType })` once per execution.
 */
function ExecutionTracker({
    user,
    onStartAsyncProcess,
    resourceData,
    processes,
    onErrorNotification
}) {
    const redirected = useRef(false);
    const notifiedError = useRef(false);

    useEffect(() => {
        const username = user?.info?.preferred_username;
        const resourcesToTrack = [resourceData];
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
            const foundProcess = processes.find((p) => p?.resource?.pk === pk && p?.processType === processType);
            if (!foundProcess) {
                onStartAsyncProcess(process);
            }
        });
    }, [user, onStartAsyncProcess, resourceData, processes]);

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
        const foundProcess = processes.filter((p) => p?.resource?.pk === resourcePk && p?.output?.status === ProcessStatus.RUNNING);
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
    }, [resourceData, processes]);

    const errorMessage = useMemo(() => {
        if (isEmpty(resourceData)) {
            return null;
        }
        const resourcePk = resourceData?.pk ?? resourceData?.id;
        if (!resourcePk) {
            return null;
        }
        const failedProcesses = processes.filter((p) =>
            p?.resource?.pk === resourcePk
            && p?.output?.status === ProcessStatus.FAILED
        );
        if (!failedProcesses?.length) {
            return null;
        }
        const { output } = failedProcesses[0] || {};
        const log = output?.log;
        return log ? getUploadErrorMessageFromCode(null, log) : null;
    }, [resourceData, processes]);

    useEffect(() => {
        if (errorMessage && !notifiedError.current) {
            notifiedError.current = true;
            onErrorNotification({
                title: 'map.mapError.errorTitle',
                message: errorMessage || 'map.mapError.errorDefault'
            });
        }
        if (!errorMessage) {
            notifiedError.current = false;
        }
    }, [errorMessage, onErrorNotification]);

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
        [userSelector, getResourceData, getCurrentProcesses],
        (user, resourceData, processes) => ({
            user,
            resourceData,
            processes
        })
    ),
    {
        onStartAsyncProcess: startAsyncProcess,
        onErrorNotification: error
    }
)(ExecutionTracker);

export default createPlugin('ExecutionTracker', {
    component: ExecutionTrackerPlugin
});
