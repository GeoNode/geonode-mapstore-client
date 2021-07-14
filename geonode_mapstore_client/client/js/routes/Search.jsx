/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useRef, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import url from 'url';
import { createSelector } from 'reselect';
import castArray from 'lodash/castArray';
import CardGrid from '@js/components/CardGrid';
import FiltersMenu from '@js/components/FiltersMenu';
import FiltersForm from '@js/components/FiltersForm';
import { getParsedGeoNodeConfiguration } from "@js/selectors/config";
import { userSelector } from '@mapstore/framework/selectors/security';
import { buildHrefByTemplate } from '@js/utils/MenuUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import {
    searchResources,
    requestResource,
    loadFeaturedResources
} from '@js/actions/gnsearch';

import {
    hashLocationToHref,
    getFilterById
} from '@js/utils/GNSearchUtils';
import { withResizeDetector } from 'react-resize-detector';

import { getResourceTypes, getCategories, getRegions, getOwners, getKeywords } from '@js/api/geonode/v2';
import MetaTags from "@js/components/MetaTags";

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

const suggestionsRequestTypes = {
    resourceTypes: {
        filterKey: 'filter{resource_type.in}',
        loadOptions: (q, params) => getResourceTypes({ ...params, q }, 'filter{resource_type.in}')
            .then(results => ({
                options: results
                    .map(({ selectOption }) => selectOption)
            }))
            .catch(() => null)
    },
    categories: {
        filterKey: 'filter{category.identifier.in}',
        loadOptions: (q, params) => getCategories({ ...params, q }, 'filter{category.identifier.in}')
            .then(results => ({
                options: results
                    .map(({ selectOption }) => selectOption)
            }))
            .catch(() => null)
    },
    keywords: {
        filterKey: 'filter{keywords.slug.in}',
        loadOptions: (q, params) => getKeywords({ ...params, q }, 'filter{keywords.slug.in}')
            .then(results => ({
                options: results
                    .map(({ selectOption }) => selectOption)
            }))
            .catch(() => null)
    },
    regions: {
        filterKey: 'filter{regions.name.in}',
        loadOptions: (q, params) => getRegions({ ...params, q }, 'filter{regions.name.in}')
            .then(results => ({
                options: results
                    .map(({ selectOption }) => selectOption)
            }))
            .catch(() => null)
    },
    owners: {
        filterKey: 'filter{owner.username.in}',
        loadOptions: (q, params) => getOwners({ ...params, q }, 'filter{owner.username.in}')
            .then(results => ({
                options: results
                    .map(({ selectOption }) => selectOption)
            }))
            .catch(() => null)
    }
};

function Search({
    location,
    params,
    onSearch,
    onEnableFiltersPanel,
    isFiltersPanelEnabled,
    config,
    onSelect,
    match,
    user,
    width,
    totalResources,
    resource,
    siteName
}) {

    const {
        filterMenuItemsAllowed,
        cardOptionsItemsAllowed,
        filtersFormItemsAllowed,
        filters
    } = config;
    const themeLayoutSize = getThemeLayoutSize(width);
    const isMounted = useRef();

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (match.url === '/search/filter/') {
            onEnableFiltersPanel(true);
        }
    }, [match.url]);

    const filtersMenuNode = useRef();

    const [isSmallDevice, setIsSmallDevice] = useState(false);
    useEffect(() => {
        setIsSmallDevice((themeLayoutSize === 'sm') ? true : false);
    }, [themeLayoutSize]);

    const handleShowFilterForm = () => {
        onEnableFiltersPanel(!isFiltersPanelEnabled);
    };

    function handleUpdate(newParams, pathname) {
        const { query } = url.parse(location.search, true);
        onSearch({
            ...query,
            ...params,
            ...newParams
        }, pathname);

    }
    // to update the overlay form in mobile device, after apply,
    // the form has to close
    const handleUpdateSmallDevice = (newParams, pathname) => {
        handleUpdate(newParams, pathname);
        handleShowFilterForm();
    };
    const [formParams, setFormParams] = useState({});

    function handleClear() {
        const { query } = url.parse(location.search, true);
        const newParams = Object.keys(query)
            .reduce((acc, key) =>
                key.indexOf('filter') === 0
                || key === 'f'
                || key === 'q'
                    ? {
                        ...acc,
                        [key]: []
                    }
                    : acc, { extent: undefined });

        setFormParams(newParams);
        handleUpdate(newParams);
    }

    function handleFormatHref(options) {
        return hashLocationToHref({
            location,
            ...options
        });
    }

    const { query } = url.parse(location.search, true);
    const queryFilters = Object.keys(query).reduce((acc, key) => key.indexOf('sort') === 0
        ? acc
        : [...acc, ...castArray(query[key]).map((value) => ({ key, value }))], []);

    const pk = match.params.pk;
    const ctype = match.params.ctype;

    useEffect(() => {
        onSelect(pk, ctype);
    }, [pk, ctype]);

    // update all the information of filter in use on mount
    // to display the correct labels
    const [reRender, setReRender] = useState(0);

    const state = useRef(false);
    state.current = {
        query

    };

    useEffect(() => {
        const suggestionsRequestTypesArray = Object.keys(suggestionsRequestTypes)
            .map((key) => suggestionsRequestTypes[key]);
        const queryKeys = Object.keys(state.current.query);
        let updateRequests = [];
        queryKeys.forEach(queryKey => {
            const suggestionRequest = suggestionsRequestTypesArray.find(({ filterKey }) => queryKey === filterKey);
            if (suggestionRequest) {
                const filtersToUpdate = castArray(state.current.query[queryKey]).filter((value) => !getFilterById(queryKey, value));
                if (filtersToUpdate?.length > 0) {
                    const request = suggestionRequest.loadOptions.bind(null, '', { idIn: filtersToUpdate });
                    updateRequests.push(request);
                }
            }
        });
        Promise.all(updateRequests.map((request) => request()))
            .then(() => {
                if (isMounted.current) {
                    setReRender(reRender + 1);
                }
            });


    }, []);

    const scrollContainer = useRef();

    return (
        <>
            <MetaTags
                logo={resource ? resource.thumbnail_url : window.location.origin + config?.navbar?.logo[0]?.src}
                title={(resource?.title) ? resource?.title + " - " + siteName : siteName }
                siteName={siteName}
                contentURL={resource?.detail_url}
                content={resource?.abstract}
            />
            <div className={`gn-fixed-card-grid gn-size-${themeLayoutSize}`}>
                {isFiltersPanelEnabled && <FiltersForm
                    key="gn-filter-form"
                    id="gn-filter-form"
                    fields={filtersFormItemsAllowed}
                    extentProps={filters?.extent}
                    suggestionsRequestTypes={suggestionsRequestTypes}
                    query={query}
                    onChange={isSmallDevice && handleUpdateSmallDevice || handleUpdate}
                    onClose={handleShowFilterForm}
                    onClear={handleClear}
                    submitOnChangeField={!isSmallDevice}
                    formParams={formParams}
                />}
                <div ref={scrollContainer} className="gn-grid-container">
                    <ConnectedCardGrid
                        user={user}
                        query={query}
                        cardOptions={cardOptionsItemsAllowed}
                        buildHrefByTemplate={buildHrefByTemplate}
                        isCardActive={res => res.pk === pk}
                        page={params.page ? parseFloat(params.page) : 1}
                        formatHref={handleFormatHref}
                        scrollContainer={scrollContainer.current}
                        onLoad={(value) => {
                            handleUpdate({
                                page: value
                            });
                        }}
                    >
                        <FiltersMenu
                            ref={filtersMenuNode}
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
        </>
    );
}

Search.propTypes = {
    dispatch: PropTypes.func,
    history: PropTypes.object,
    location: PropTypes.object,
    match: PropTypes.object,
    plugins: PropTypes.object,
    pluginsConfig: PropTypes.array,
    background: PropTypes.object,
    logo: PropTypes.array,
    jumbotron: PropTypes.object
};

Search.defaultProps = {
    background: {},
    logo: [],
    jumbotron: {},
    isFilterForm: false
};

const DEFAULT_PARAMS = {};


const ConnectedSearch = connect(

    createSelector([
        state => state?.gnsearch?.params || DEFAULT_PARAMS,
        userSelector,
        state => state?.gnresource?.data || null,
        state => state?.controls?.gnFiltersPanel?.enabled || null,
        getParsedGeoNodeConfiguration,
        state => state?.gnsearch?.total || 0,
        state => state?.localConfig?.siteName || "Geonode"
    ], (params, user, resource, isFiltersPanelEnabled, config, totalResources, siteName) => ({
        params,
        user,
        resource,
        isFiltersPanelEnabled,
        config,
        totalResources,
        siteName
    })),
    {
        onSearch: searchResources,
        onSelect: requestResource,
        onEnableFiltersPanel: setControlProperty.bind(null, 'gnFiltersPanel', 'enabled'),
        fetchFeaturedResources: loadFeaturedResources
    }
)(withResizeDetector(Search));

export default ConnectedSearch;
