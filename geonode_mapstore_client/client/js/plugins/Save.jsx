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
import Message from '@mapstore/framework/components/I18N/Message';
import { mapInfoSelector } from '@mapstore/framework/selectors/map';
import Loader from '@mapstore/framework/components/misc/Loader';
import Button from '@mapstore/framework/components/layout/Button';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import { isLoggedIn } from '@mapstore/framework/selectors/security';
import controls from '@mapstore/framework/reducers/controls';
import gnresource from '@js/reducers/gnresource';
import gnsave from '@js/reducers/gnsave';
import gnsaveEpics from '@js/epics/gnsave';
import { saveDirectContent } from '@js/actions/gnsave';
import {
    isNewResource,
    canEditResource,
    getResourceDirtyState
} from '@js/selectors/resource';
import { getCurrentResourcePermissionsLoading } from '@js/selectors/resourceservice';
import { withRouter } from 'react-router';
import withPrompt from '@js/plugins/save/withPrompt';

function Save(props) {
    return props.saving ? (<div
        style={{ position: 'absolute', width: '100%',
            height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.75)',
            top: '0px', zIndex: 2000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', right: '0px'}}>
        <Loader size={150}/>
    </div>) : null;
}

const SavePlugin = connect(
    createSelector([
        state => state?.gnsave?.saving
    ], (saving) => ({
        saving
    }))
)(Save);

function SaveButton({
    onClick,
    variant,
    size,
    loading,
    className,
    dirtyState: dirtyStateProp,
    saveMsgId = "gnviewer.save"
}) {
    return (
        <Button
            variant={variant || "primary"}
            size={size}
            onClick={() => onClick()}
            disabled={loading}
            className={`${className ?? ''} ${dirtyStateProp ? 'ms-notification-circle warning' : ''}`}
        >
            <Message msgId={saveMsgId}/>{' '}{loading && <Spinner />}
        </Button>
    );
}

function ResourceDetailsSaveButton({
    component,
    loading,
    onClick,
    dirtyState
}) {
    const Component = component;
    return Component
        ? (
            <Component
                glyph="floppy-disk"
                iconType="glyphicon"
                labelId="save"
                square
                className={dirtyState ? 'ms-notification-circle warning' : ''}
                disabled={!dirtyState || loading}
                onClick={() => onClick()}
                loading={loading}
            />
        )
        : null;
}

const saveConnector = connect(
    createSelector(
        isLoggedIn,
        isNewResource,
        canEditResource,
        mapInfoSelector,
        getCurrentResourcePermissionsLoading,
        getResourceDirtyState,
        state => state?.gnsave?.saving,
        (loggedIn, isNew, canEdit, mapInfo, permissionsLoading, dirtyState, saveLoading) => ({
            // we should add permList to map pages too
            // currently the canEdit is located inside the map info
            enabled: loggedIn && !isNew && (canEdit || mapInfo?.canEdit),
            loading: permissionsLoading || saveLoading,
            dirtyState
        })
    ),
    {
        onClick: saveDirectContent
    }
);

export default createPlugin('Save', {
    component: SavePlugin,
    containers: {
        ActionNavbar: {
            name: 'Save',
            Component: saveConnector(((withRouter(withPrompt(SaveButton))))),
            doNotHide: true,
            priority: 2
        },
        ResourceDetails: {
            name: 'Save',
            target: 'toolbar',
            Component: saveConnector(ResourceDetailsSaveButton),
            priority: 1
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
