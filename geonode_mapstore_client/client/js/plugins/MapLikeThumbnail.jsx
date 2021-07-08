/*
 * Copyright 2021, GeoSolutions Sas.
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
import { isLoggedIn } from '@mapstore/framework/selectors/security';
import controls from '@mapstore/framework/reducers/controls';
import gnresource from '@js/reducers/gnresource';
import gnsave from '@js/reducers/gnsave';
import gnsaveEpics from '@js/epics/gnsave';
import { setMapLikeThumbnail } from '@js/actions/gnresource';
import {toggleControl} from '@mapstore/framework/actions/controls';
import {
    isNewResource,
    canEditResource
} from '@js/selectors/gnresource';


function MapLikeThumbnail(props) {
    return props.saving ? (<div
        style={{ position: 'absolute', width: '100%',
            height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.75)',
            top: '0px', zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', right: '0px'}}>
        <Loader size={150}/>
    </div>) : null;
}

const MapLikeThumbnailPlugin = connect(
    createSelector([
        state => state?.gnsave?.saving
    ], (saving) => ({
        saving
    }))
)(MapLikeThumbnail);

function MapLikeThumbnailButton({
    enabled,
    onClick
}) {
    return enabled
        ? <Button
            variant="primary"
            onClick={() => onClick()}
        >
            <Message msgId="gnviewer.setMapLikeThumbnail"/>
        </Button>
        : null
    ;
}


const ConnectedMapLikeThumbnailButton = connect(
    createSelector(
        isLoggedIn,
        isNewResource,
        canEditResource,
        mapInfoSelector,
        (loggedIn, isNew, canEdit, mapInfo) => ({
            enabled: loggedIn && !isNew && (canEdit || mapInfo?.canEdit)
        })
    ),
    {
        onClick: setMapLikeThumbnail
    }
)((MapLikeThumbnailButton));

export default createPlugin('MapLikeThumbnail', {
    component: MapLikeThumbnailPlugin,
    containers: {
        ActionNavbar: {
            name: 'MapLikeThumbnail',
            target: 'leftMenuItem',
            Component: ConnectedMapLikeThumbnailButton
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
