/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import Message from '@mapstore/framework/components/I18N/Message';
import { mapInfoSelector } from '@mapstore/framework/selectors/map';
import { userSelector } from '@mapstore/framework/selectors/security';
import Button from '@js/components/Button';
import {
    saveContent,
    clearSave
} from '@js/actions/gnsave';
import controls from '@mapstore/framework/reducers/controls';
import gnresource from '@js/reducers/gnresource';
import gnsave from '@js/reducers/gnsave';
import gnsaveEpics from '@js/epics/gnsave';
import SaveModal from '@js/plugins/save/SaveModal';
import {
    canAddResource,
    getResourceId,
    getResourceData,
    isNewResource,
    getResourceDirtyState
} from '@js/selectors/resource';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { canCopyResource } from '@js/utils/ResourceUtils';
import { processResources } from '@js/actions/gnresource';
import { getCurrentResourceCopyLoading } from '@js/selectors/resourceservice';
import Dropdown from '@js/components/Dropdown';
import FaIcon from '@js/components/FaIcon';
import withPrompt from '@js/plugins/save/withPrompt';

function SaveAs({
    resources,
    onSave,
    onCopy,
    isNew,
    closeOnSave,
    labelId,
    ...props
}) {
    return (
        <SaveModal
            {...props}
            hideDescription={!isNew}
            copy={!isNew}
            // add key to reset the component when a new resource is returned
            key={props?.resource?.pk || 'new'}
            labelId={labelId || 'save'}
            onSave={(id, metadata, reload) => {
                if (isNew) {
                    // only new resource follow the sync save
                    onSave(id, metadata, reload);
                } else {
                    // existing resource are using the async copy workflow
                    onCopy([
                        {
                            ...props?.resource,
                            title: metadata.name || props?.resource?.title
                        }
                    ]);
                }
                // catalogue page must close the clone modal as soon as the user click on clone
                if (closeOnSave) {
                    props.onClose();
                }
            }}
        />
    );
}

const SaveAsPlugin = connect(
    createSelector([
        state => state?.controls?.[ProcessTypes.COPY_RESOURCE]?.value,
        mapInfoSelector,
        state => state?.gnresource?.loading,
        state => state?.gnsave?.saving,
        state => state?.gnsave?.error,
        state => state?.gnsave?.success,
        getResourceId,
        isNewResource,
        getCurrentResourceCopyLoading
    ], (resources, mapInfo, loading, saving, error, success, contentId, isNew, processLoading) => ({
        enabled: !!resources,
        contentId: contentId || mapInfo?.id,
        resource: resources?.[0],
        loading: processLoading || loading,
        saving,
        error,
        success,
        isNew
    })),
    {
        onClose: setControlProperty.bind(null, ProcessTypes.COPY_RESOURCE, 'value', undefined),
        onSave: saveContent,
        onCopy: processResources.bind(null, ProcessTypes.COPY_RESOURCE),
        onClear: clearSave
    }
)(SaveAs);

function SaveAsButton({
    onClick,
    variant,
    size,
    resource,
    dirtyState,
    disabled
}) {

    return (
        <Button
            variant={dirtyState ? 'warning' : (variant || "primary")}
            size={size}
            disabled={disabled}
            onClick={() => onClick([ resource ])}
        >
            <Message msgId="saveAs"/>
        </Button>
    );
}

const canCopyResourceFunction = (state) => {
    return (resource) => {
        const user = userSelector(state);
        if (!user) {
            return false;
        }
        const isResourceNew = isNewResource(state);
        const canAdd = canAddResource(state);
        if (isResourceNew && canAdd) {
            return true;
        }
        return canCopyResource(resource, user);
    };
};

const isDisabledByDirtyState = (dirtyState) => {
    return typeof dirtyState === 'object' ? !!dirtyState : false;
};

const ConnectedSaveAsButton = connect(
    createSelector(
        getResourceData,
        getResourceDirtyState,
        canCopyResourceFunction,
        (resource, dirtyState, canCopy) => ({
            enabled: !!canCopy(resource),
            resource,
            dirtyState: !isDisabledByDirtyState(dirtyState) && !!dirtyState,
            disabled: isDisabledByDirtyState(dirtyState)
        })
    ),
    {
        onClick: setControlProperty.bind(null, ProcessTypes.COPY_RESOURCE, 'value')
    }
)(withPrompt(SaveAsButton));

function CopyMenuItem({
    resource,
    canCopy,
    onCopy
}) {
    if (!canCopy(resource)) {
        return null;
    }
    return (
        <Dropdown.Item
            onClick={() =>
                onCopy([resource])
            }
        >
            <FaIcon name="copy" />{' '}
            <Message msgId="gnviewer.clone" />
        </Dropdown.Item>
    );
}

const ConnectedMenuItem = connect(
    createSelector([
        canCopyResourceFunction
    ], (canCopy) => ({
        canCopy
    })),
    {
        onCopy: setControlProperty.bind(null, ProcessTypes.COPY_RESOURCE, 'value')
    }
)((CopyMenuItem));

/**
* @module SaveAs
*/

/**
 * enable button or menu item to clone a specific resource
 * @name SaveAs
 * @prop {boolean} closeOnSave close the modal after clicking on save button
 * @example
 * {
 *  "name": "SaveAs",
 *  "cfg": {
 *      "closeOnSave": true
 *  }
 * }
 */
export default createPlugin('SaveAs', {
    component: SaveAsPlugin,
    containers: {
        ActionNavbar: {
            name: 'SaveAs',
            Component: ConnectedSaveAsButton
        },
        ResourcesGrid: {
            name: ProcessTypes.COPY_RESOURCE,
            target: 'cardOptions',
            Component: ConnectedMenuItem
        }
    },
    epics: {
        ...gnsaveEpics
    },
    reducers: {
        gnresource,
        gnsave,
        controls
    }
});
