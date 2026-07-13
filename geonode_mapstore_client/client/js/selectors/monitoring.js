/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const SESSION_MONITORING_DIALOG = 'sessionMonitoringDialog';

export const isMonitoringDialogOpen = state => !!state?.controls?.[SESSION_MONITORING_DIALOG]?.enabled;
