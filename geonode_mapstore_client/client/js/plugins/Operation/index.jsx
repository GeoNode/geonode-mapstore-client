/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import Button from '@mapstore/framework/components/layout/Button';
import { selectOperation, reloadOperation } from './actions/operation';
import { getResourceData } from '@js/selectors/resource';
import operation from './reducers/operation';
import epics from './epics/operation';
import OperationUpload from './containers/OperationUpload';
import Message from '@mapstore/framework/components/I18N/Message';

/**
* @module Operation
*/

/**
 * render a upload interface for the configured operation
 * @name Operation.
 * @prop {string} id unique identifier of the operation
 * @prop {string} labelId label id for the menu button on the action navbar that opens the upload interface
 * @prop {boolean} blocking if true the ui will prevent interaction with the resource until the operation is completed
 * @prop {string} iconName a font awesome icon name for the central section
 * @prop {string} titleMsgId title for the central section
 * @prop {string} descriptionMsgId description for the central section
 * @prop {string} action the operation action used in the upload process
 * @prop {boolean} pageReload if true the page is reloaded after clicking on reload
 * @prop {object} api an object with the api configuration for upload and execution request
 * @prop {object} api.upload configuration for the upload process
 * @prop {string} api.upload.url upload endpoint
 * @prop {string} api.upload.method request method (default post)
 * @prop {number} api.upload.maxParallelUploads number of maximum parallel uploads
 * @prop {boolean} api.upload.enableRemoteUploads enable the remote upload button
 * @prop {array} api.upload.supportedFiles list of supported type of upload
 * @prop {object} api.upload.body body request configuration
 * @prop {object} api.upload.body.file body request configuration for file uploads
 * @prop {object} api.upload.body.remote body request configuration for remote uploads
 * @prop {object} api.executionRequest configuration for the execution requests
 * @prop {string} api.executionRequest.url execution requests endpoint
 * @prop {object} api.executionRequest.params query parameters for the request
 * @example
 * {
 *  "name": "Operation",
 *  "cfg": {
 *      "containerPosition": "header",
 *      "id": "operation-id",
 *      "labelId": "gnviewer.operationLabel",
 *      "blocking": true,
 *      "iconName": "file",
 *      "titleMsgId": "gnviewer.operationTitle",
 *      "descriptionMsgId": "gnviewer.operationDescription",
 *      "action": "upload",
 *      "api": {
 *          "upload": {
 *              "url": "{context.getEndpointUrl('uploads', '/upload')}",
 *              "maxParallelUploads": 1,
 *              "enableRemoteUploads": false,
 *              "supportedFiles": "{context.getSupportedFilesByResourceType('dataset', { actions: ['upload'] })}",
 *              "body": {
 *                  "file": {
 *                      "base_file": "{context.getUploadMainFile}",
 *                      "resource_pk": "{context.get(state('gnResourceData'), 'pk')}",
 *                      "action": "upload"
 *                  }
 *              }
 *          },
 *          "executionRequest": {
 *              "url": "{context.getEndpointUrl('executionrequest')}",
 *              "params": {
 *                  "filter{action}": "upload",
 *                  "sort[]": "-created",
 *                  "filter{geonode_resource}": "{context.get(state('gnResourceData'), 'pk')}"
 *              }
 *          }
 *      }
 *  },
 *  "override": {
 *      "ActionNavbar": {
 *          "name": "OperationId"
 *      }
 *  }
 * }
 */
function Operation({
    id,
    selected,
    resource,
    api,
    onReload,
    onSelect,
    blocking,
    iconName,
    titleMsgId,
    descriptionMsgId,
    action,
    pageReload
}) {

    // open the import ui if a blocking execution is still running
    const executions = resource?.executions;
    useEffect(() => {
        if (executions && action && blocking) {
            const runningExecution = executions
                .find((execution) => execution.status === 'running'
                && execution?.input_params?.action === action);
            if (runningExecution) {
                onSelect(id);
            }
        }
    }, [id, blocking, action, executions]);

    if (selected !== id) {
        return null;
    }
    return (
        <OperationUpload
            api={api}
            onSelect={onSelect}
            blocking={blocking}
            onReload={onReload}
            iconName={iconName}
            titleMsgId={titleMsgId}
            descriptionMsgId={descriptionMsgId}
            pageReload={pageReload}
        />
    );
}

const OperationPlugin = connect(
    createSelector([
        state => state?.operation?.selected,
        getResourceData
    ], (selected, resource) => ({
        selected,
        resource
    })),
    {
        onSelect: selectOperation,
        onReload: reloadOperation
    }
)(Operation);

function OperationButton({
    id,
    labelId,
    size,
    variant,
    onClick
}) {
    return (
        <Button size={size} variant={variant} onClick={() => onClick(id)}>
            <Message msgId={labelId} />
        </Button>
    );
}

const ConnectedOperationButton = connect(
    createSelector([], () => ({})),
    {
        onClick: selectOperation
    }
)(OperationButton);

export default createPlugin('Operation', {
    component: OperationPlugin,
    containers: {
        ActionNavbar: {
            Component: ConnectedOperationButton
        }
    },
    epics,
    reducers: {
        operation
    }
});
