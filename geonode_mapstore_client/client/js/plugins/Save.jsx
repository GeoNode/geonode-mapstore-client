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
import { Glyphicon } from 'react-bootstrap';
import { mapInfoSelector } from '@mapstore/framework/selectors/map';
import Loader from '@mapstore/framework/components/misc/Loader';
import Button from '@js/components/Button';
import { isLoggedIn } from '@mapstore/framework/selectors/security';
import controls from '@mapstore/framework/reducers/controls';
import gnresource from '@js/reducers/gnresource';
import gnsave from '@js/reducers/gnsave';
import gnsaveEpics from '@js/epics/gnsave';
import { saveDirectContent } from '@js/actions/gnsave';
import {
    isNewResource,
    canEditResource
} from '@js/selectors/resource';
/**
 * Plugin for Save modal
 * @name Save
 * @class
 * @memberof plugins
 * @prop {object} cfg.thumbnailOptions the thumbnail is scaled based on the following configuration
 * @prop {number} cfg.thumbnailOptions.width final width of thumbnail
 * @prop {number} cfg.thumbnailOptions.height final height of thumbnail
 * @prop {string} cfg.thumbnailOptions.type type format of thumbnail 'image/jpeg' or 'image/png'
 * @prop {number} cfg.thumbnailOptions.quality image quality if type is 'image/jpeg', value between 0 and 1
 * @prop {bool} cfg.thumbnailOptions.contain if contain is true the thumbnail is contained in the width and height provided, if contain is false the image will cover the provided width and height
 * @example
 * {
 *   "name": "Save",
 *   "cfg": {
 *     "thumbnailOptions": {
 *       "width": 300,
 *       "height": 250,
 *       "type": "image/jpeg",
 *       "quality": 0.9,
 *       "contain": false
 *     }
 *   }
 * }
 */
function Save(props) {
    return props.saving ? (<div
        style={{ position: 'absolute', width: '100%',
            height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.75)',
            top: '0px', zIndex: 1000, display: 'flex',
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
    enabled,
    onClick,
    variant,
    size
}) {
    return enabled
        ? <Button
            variant={variant || "primary"}
            size={size}
            onClick={() => onClick()}
        >
            <Message msgId="save"/>
        </Button>
        : null
    ;
}

const ConnectedSaveButton = connect(
    createSelector(
        isLoggedIn,
        isNewResource,
        canEditResource,
        mapInfoSelector,
        (loggedIn, isNew, canEdit, mapInfo) => ({
            // we should add permList to map pages too
            // currently the canEdit is located inside the map info
            enabled: loggedIn && !isNew && (canEdit || mapInfo?.canEdit)
        })
    ),
    {
        onClick: saveDirectContent
    }
)((SaveButton));

export default createPlugin('Save', {
    component: SavePlugin,
    containers: {
        BurgerMenu: {
            name: 'save',
            position: 30,
            text: <Message msgId="save"/>,
            icon: <Glyphicon glyph="floppy-open"/>,
            action: saveDirectContent,
            selector: createSelector(
                isLoggedIn,
                isNewResource,
                canEditResource,
                mapInfoSelector,
                (loggedIn, isNew, canEdit, mapInfo) => ({
                    // we should add permList to map pages too
                    // currently the canEdit is located inside the map info
                    style: loggedIn && !isNew && (canEdit || mapInfo?.canEdit) ? {} : { display: 'none' }
                })
            )
        },
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
