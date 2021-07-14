/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import url from 'url';
import { createSelector } from 'reselect';
import castArray from 'lodash/castArray';
import CardGrid from '@js/components/CardGrid';
import FiltersMenu from '@js/components/FiltersMenu';
import FeaturedList from '@js/components/FeaturedList';
import { getParsedGeoNodeConfiguration } from "@js/selectors/config";
import { userSelector } from '@mapstore/framework/selectors/security';
import { buildHrefByTemplate } from '@js/utils/MenuUtils';
import {
    searchResources,
    loadFeaturedResources
} from '@js/actions/gnsearch';

import { hashLocationToHref } from '@js/utils/GNSearchUtils';
import { withResizeDetector } from 'react-resize-detector';

import {
    getThemeLayoutSize
} from '@js/utils/AppUtils';

const DEFAULT_RESOURCES = [];

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
        state => state?.gnsearch?.resources || DEFAULT_RESOURCES,
        state => state?.gnsearch?.loading || false,
        state => state?.gnsearch?.isNextPageAvailable || false,
        state => state?.gnsearch?.isFirstRequest
    ], (resources, loading, isNextPageAvailable, isFirstRequest) => ({
        resources,
        loading,
        isNextPageAvailable,
        isFirstRequest
    }))
)(CardGridWithMessageId);

const ConnectedFeatureList = connect(
    createSelector([
        state => state?.gnsearch?.featuredResources?.resources || DEFAULT_RESOURCES,
        state => state?.gnsearch?.featuredResources?.page || 1,
        state => state?.gnsearch?.featuredResources?.isNextPageAvailable || false,
        state => state?.gnsearch?.featuredResources?.isPreviousPageAvailable || false,
        state => state?.gnsearch?.featuredResources?.loading || false
    ], (resources, page, isNextPageAvailable, isPreviousPageAvailable, loading) => ({
        resources, page, isNextPageAvailable, isPreviousPageAvailable, loading})
    ), {loadFeaturedResources}
)(FeaturedList);

function Home({
    location,
    params,
    onSearch,
    config,
    user,
    width,
    totalResources,
    fetchFeaturedResources = () => {}
}) {

    const cataloguePage = '/catalogue/';

    const {
        filterMenuItemsAllowed,
        cardOptionsItemsAllowed,
        filters
    } = config;

    const pageSize = getThemeLayoutSize(width);

    const handleShowFilterForm = () => {
        window.location = `${cataloguePage}#/search/filter/${location.search}`;
    };

    function handleUpdate(newParams, pathname) {
        const { query } = url.parse(location.search, true);
        onSearch({
            ...query,
            ...params,
            ...newParams
        }, pathname);
    }

    function handleClear() {
        const { query } = url.parse(location.search, true);
        const newParams = Object.keys(query)
            .reduce((acc, key) =>
                key.indexOf('filter') === 0
                || key === 'f'
                    ? {
                        ...acc,
                        [key]: []
                    }
                    : acc, { extent: undefined });
        handleUpdate(newParams);
    }

    function handleFormatHref(options) {
        return cataloguePage + hashLocationToHref({
            location,
            ...options
        });
    }

    const { query } = url.parse(location.search, true);
    const queryFilters = Object.keys(query).reduce((acc, key) => key.indexOf('sort') === 0
        ? acc
        : [...acc, ...castArray(query[key]).map((value) => ({ key, value }))], []);

    return (
        <div className="gn-container">
            <div className="gn-row gn-home-section">
                <div className="gn-grid-container">
                    <ConnectedFeatureList
                        query={query}
                        formatHref={handleFormatHref}
                        buildHrefByTemplate={buildHrefByTemplate}
                        onLoad={fetchFeaturedResources}
                        containerStyle={{
                            minHeight: 'auto'
                        }}/>

                </div>
            </div>
            <div className="gn-row">
                <div className="gn-grid-container">
                    <ConnectedCardGrid
                        user={user}
                        query={query}
                        pageSize={pageSize}
                        cardOptions={cardOptionsItemsAllowed}
                        buildHrefByTemplate={buildHrefByTemplate}
                        page={params.page ? parseFloat(params.page) : 1}
                        formatHref={handleFormatHref}
                        onLoad={(value) => {
                            handleUpdate({
                                page: value
                            });
                        }}
                    >
                        <FiltersMenu
                            formatHref={handleFormatHref}
                            cardsMenu={filterMenuItemsAllowed || []}
                            order={query?.sort}
                            onClear={handleClear}
                            onClick={handleShowFilterForm}
                            orderOptions={filters?.order?.options}
                            defaultLabelId={filters?.order?.defaultLabelId}
                            totalResources={totalResources}
                            totalFilters={queryFilters.length}
                            filtersActive={!!(queryFilters.length > 0)}
                        />
                    </ConnectedCardGrid>
                </div>
            </div>
        </div>
    );
}

Home.propTypes = {
    location: PropTypes.object,
    params: PropTypes.object,
    onSearch: PropTypes.func,
    config: PropTypes.object,
    user: PropTypes.object,
    width: PropTypes.number,
    totalResources: PropTypes.object,
    fetchFeaturedResources: PropTypes.func
};

Home.defaultProps = {
    onSearch: () => {},
    fetchFeaturedResources: () => {}
};

const DEFAULT_PARAMS = {};

const ConnectedHome = connect(
    createSelector([
        state => state?.gnsearch?.params || DEFAULT_PARAMS,
        userSelector,
        getParsedGeoNodeConfiguration,
        state => state?.gnsearch?.total || 0
    ], (params, user, config, totalResources) => ({
        params,
        user,
        config,
        totalResources
    })),
    {
        onSearch: searchResources,
        fetchFeaturedResources: loadFeaturedResources
    }
)(withResizeDetector(Home));

export default ConnectedHome;
