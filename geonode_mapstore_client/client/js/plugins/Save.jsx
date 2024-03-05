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
import Button from '@js/components/Button';
import Spinner from '@js/components/Spinner';
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
    dirtyState: dirtyStateProp
}) {
    return (
        <Button
            variant={dirtyStateProp ? 'warning' : (variant || "primary")}
            size={size}
            onClick={() => onClick()}
            disabled={loading}
            className={className}
        >
            <Message msgId="save"/>{' '}{loading && <Spinner />}
        </Button>
    );
}

const ConnectedSaveButton = connect(
    createSelector(
        isLoggedIn,
        isNewResource,
        canEditResource,
        mapInfoSelector,
        getCurrentResourcePermissionsLoading,
        getResourceDirtyState,
        (loggedIn, isNew, canEdit, mapInfo, permissionsLoading, dirtyState) => ({
            // we should add permList to map pages too
            // currently the canEdit is located inside the map info
            enabled: loggedIn && !isNew && (canEdit || mapInfo?.canEdit),
            loading: permissionsLoading,
            dirtyState
        })
    ),
    {
        onClick: saveDirectContent
    }
)((withRouter(withPrompt(SaveButton))));

export default createPlugin('Save', {
    component: SavePlugin,
    containers: {
        ActionNavbar: {
            name: 'Save',
            Component: ConnectedSaveButton
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
