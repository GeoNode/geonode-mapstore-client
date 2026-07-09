/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';
import ConfirmDialog from '@mapstore/framework/components/layout/ConfirmDialog';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { LOGIN_URL } from '@js/api/geonode/v2/constants';
import { warning as warningNotification } from '@mapstore/framework/actions/notifications';
import {
    SESSION_MONITORING_DIALOG,
    isMonitoringDialogOpen
} from '@js/selectors/monitoring';

const goToLogin = (url) => {
    const nextUrl = url || (window.location.pathname + window.location.search + window.location.hash) || '/';
    window.location.href = LOGIN_URL + '?next=' + encodeURIComponent(nextUrl);
};

function MonitoringDialog({ show, onClose }) {
    return (
        <ConfirmDialog
            show={show}
            onConfirm={goToLogin}
            onCancel={onClose}
            titleId="gnviewer.sessionExpiredTitle"
            descriptionId="gnviewer.sessionExpiredDescription"
            confirmId="gnviewer.goToLogin"
            cancelId="cancel"
            preventHide={false}
            variant="primary"
        />
    );
}

export default connect(
    state => ({ show: isMonitoringDialogOpen(state) }),
    (dispatch) => ({
        onClose: () => {
            dispatch(setControlProperty(SESSION_MONITORING_DIALOG, 'enabled', false));
            dispatch(warningNotification({
                title: "gnviewer.sessionExpiredTitle",
                message: "gnviewer.sessionExpiredDescription",
                autoDismiss: 0,
                action: {
                    label: "gnviewer.goToLogin",
                    callback: goToLogin
                }
            }));
        }
    })
)(MonitoringDialog);
