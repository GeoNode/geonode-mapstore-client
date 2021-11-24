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
    getFilterById,
    clearQueryParams,
    getQueryFilters
} from '@js/utils/SearchUtils';
import { withResizeDetector } from 'react-resize-detector';

import { getCategories, getRegions, getOwners, getKeywords } from '@js/api/geonode/v2';
import MetaTags from "@js/components/MetaTags";

import {
    getThemeLayoutSize
} from '@js/utils/AppUtils';
import { getTotalResources } from '@js/selectors/search';
import ConnectedCardGrid from '@js/routes/catalogue/ConnectedCardGrid';
import DeleteResource from '@js/plugins/DeleteResource';
import SaveAs from '@js/plugins/SaveAs';
const { DeleteResourcePlugin } = DeleteResource;
const { SaveAsPlugin } = SaveAs;

const suggestionsRequestTypes = {
    categories: {
        filterKey: 'filter{category.identifier.in}',
        loadOptions: params => getCategories(params, 'filter{category.identifier.in}')
    },
    keywords: {
        filterKey: 'filter{keywords.slug.in}',
        loadOptions: params => getKeywords(params, 'filter{keywords.slug.in}')
    },
    regions: {
        filterKey: 'filter{regions.name.in}',
        loadOptions: params => getRegions(params, 'filter{regions.name.in}')
    },
    owners: {
        filterKey: 'filter{owner.username.in}',
        loadOptions: params => getOwners(params, 'filter{owner.username.in}')
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
    siteName,
    loading
}) {
    const {
        filterMenuItemsAllowed,
        cardOptionsItemsAllowed,
        filtersFormItemsAllowed,
        filters
    } = config;

    const themeLayoutSize = getThemeLayoutSize(width);

    function handleUpdate(newParams, pathname) {
        const { query } = url.parse(location.search, true);
        onSearch({
            ...query,
            ...newParams
        }, pathname);
    }

    function handleClear() {
        const newParams = clearQueryParams(location);
        handleUpdate(newParams);
    }

    function handleFormatHref(options) {
        return hashLocationToHref({
            location,
            ...options
        });
    }

    const { query } = url.parse(location.search, true);
    const queryFilters = getQueryFilters(query);

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

    const handleShowFilterForm = () => {
        onEnableFiltersPanel(!isFiltersPanelEnabled);
    };

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
                    const request = suggestionRequest.loadOptions.bind(null, { includes: filtersToUpdate, pageSize: filtersToUpdate.length });
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
                    key={`gn-filter-form-${reRender}`}
                    id="gn-filter-form"
                    fields={filtersFormItemsAllowed}
                    extentProps={filters?.extent}
                    suggestionsRequestTypes={suggestionsRequestTypes}
                    query={query}
                    onChange={handleUpdate}
                    onClose={handleShowFilterForm}
                    onClear={handleClear}
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
                            loading={loading}
                        />
                    </ConnectedCardGrid>
                </div>
            </div>
            <DeleteResourcePlugin redirectTo={false} />
            <SaveAsPlugin closeOnSave labelId="gnviewer.clone"/>
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
        getTotalResources,
        state => state?.gnsettings?.siteName || "Geonode",
        state => state?.gnsearch.loading || false
    ], (params, user, resource, isFiltersPanelEnabled, config, totalResources, siteName, loading) => ({
        params,
        user,
        resource,
        isFiltersPanelEnabled,
        config,
        totalResources,
        siteName,
        loading
    })),
    {
        onSearch: searchResources,
        onSelect: requestResource,
        onEnableFiltersPanel: setControlProperty.bind(null, 'gnFiltersPanel', 'enabled'),
        fetchFeaturedResources: loadFeaturedResources
    }
)(withResizeDetector(Search));

export default ConnectedSearch;
