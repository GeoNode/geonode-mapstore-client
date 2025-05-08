/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import { isLoggedIn } from '@mapstore/framework/selectors/security';
import gnsyncEpics from '@js/epics/gnsync';
import { syncResources } from '@js/actions/gnsync';

function SyncButton({ synchronize, enabled, size }) {

    return enabled && (<Button
        variant="primary"
        size={size}
        onClick={() => synchronize()}>
        <Message msgId="gnviewer.sync" />
    </Button>);
}

SyncButton.contextTypes = {
    synchronize: PropTypes.func
};

export const ConnectedSyncButton = connect(
    createSelector(
        isLoggedIn,
        (loggedIn) => ({
            enabled: loggedIn
        })
    ),
    {
        synchronize: syncResources
    })(SyncButton);

export default createPlugin('Sync', {
    component: ConnectedSyncButton,
    containers: {
        ActionNavbar: {
            name: 'Sync',
            priority: 1
        }
    },
    epics: {
        ...gnsyncEpics
    },
    reducers: {}
});
