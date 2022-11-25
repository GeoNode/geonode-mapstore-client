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
import { generalResourceDownload } from '@js/selectors/resourceservice';

const CardGridWithMessageId = ({ query, user, isFirstRequest, error, ...props }) => {
    const hasResources = props.resources?.length > 0;
    const hasFilter = Object.keys(query || {}).filter(key => key !== 'sort').length > 0;
    const isLoggedIn = !!user;
    const messageId = !hasResources && !isFirstRequest && !props.loading
        ? error && 'errorResourcePage'
            || hasFilter && 'noResultsWithFilter'
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
        state => state?.gnsearch?.isFirstRequest,
        generalResourceDownload,
        state => state?.gnsearch?.error
    ], (resources, loading, isNextPageAvailable, isFirstRequest, downloading, error) => ({
        resources,
        loading,
        isNextPageAvailable,
        isFirstRequest,
        downloading,
        error
    }))
)(CardGridWithMessageId);

export default ConnectedCardGrid;
