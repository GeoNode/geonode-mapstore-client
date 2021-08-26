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
import CardGrid from '@js/components/CardGrid';
import { getSearchResults } from '@js/selectors/search';
import { processResources } from '@js/actions/gnresource';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';

const CardGridWithMessageId = ({ query, user, isFirstRequest, ...props }) => {
    const hasResources = props.resources?.length > 0;
    const hasFilter = Object.keys(query || {}).filter(key => key !== 'sort').length > 0;
    const isLoggedIn = !!user;
    const messageId = !hasResources && !isFirstRequest && !props.loading
        ? hasFilter && 'noResultsWithFilter'
            || isLoggedIn && 'noContentYet'
            || 'noPublicContent'
        : undefined;
    return <CardGrid { ...props } messageId={messageId}  />;
};

const ConnectedCardGrid = connect(
    createSelector([
        getSearchResults,
        state => state?.gnsearch?.loading || false,
        state => state?.gnsearch?.isNextPageAvailable || false,
        state => state?.gnsearch?.isFirstRequest
    ], (resources, loading, isNextPageAvailable, isFirstRequest) => ({
        resources,
        loading,
        isNextPageAvailable,
        isFirstRequest,
        actions: {
            'delete': {
                processType: ProcessTypes.DELETE_RESOURCE,
                isControlled: true
            },
            'copy': {
                processType: ProcessTypes.COPY_RESOURCE,
                isControlled: true
            }
        }
    })),
    {
        onAction: processResources,
        onControl: setControlProperty
    }
)(CardGridWithMessageId);

export default ConnectedCardGrid;
