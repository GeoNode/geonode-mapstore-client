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
import { loadLocale } from '@mapstore/framework/actions/locale';
import { currentLocaleSelector } from '@mapstore/framework/selectors/locale';
import SearchBar from '@js/components/home/SearchBar';
import BrandNavbar from '@js/components/home/BrandNavbar';
import Hero from '@js/components/home/Hero';
import MenuIndex from '@js/components/home/MenuIndex';
import CardGrid from '@js/components/home/CardGrid';
import DetailsPanel from '@js/components/home/DetailsPanel';
import FiltersMenu from '@js/components/home/FiltersMenu';
import FiltersForm from '@js/components/FiltersForm';
import LanguageSelector from '@js/components/home/LanguageSelector';
import { getParsedGeoNodeConfiguration } from "@js/selectors/config";
import { userSelector } from '@mapstore/framework/selectors/security';
import { buildHrefByTemplate } from '@js/utils/MenuUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import {
    fetchSuggestions,
    searchResources,
    requestResource,
    updateSuggestions
} from '@js/actions/gnsearch';

import {
    hashLocationToHref,
    getFilterById
} from '@js/utils/GNSearchUtils';
import { withResizeDetector } from 'react-resize-detector';
import Footer from '@js/components/home/Footer';
import { useInView } from 'react-intersection-observer';
import {
    getKeywords,
    getCategories,
    getRegions,
    getOwners
} from '@js/api/geonode/v1';
import { getResourceTypes } from '@js/api/geonode/v2';

const DEFAULT_SUGGESTIONS = [];
const DEFAULT_RESOURCES = [];
const ConnectedLanguageSelector = connect(
    createSelector([
        currentLocaleSelector
    ], (value) => ({
        value
    })),
    {
        onSelect: loadLocale.bind(null, null)
    }
)(LanguageSelector);

const ConnectedSearchBar = connect(
    createSelector([
        state => state?.gnsearch?.suggestions || DEFAULT_SUGGESTIONS,
        state => state?.gnsearch?.loading || false
    ], (suggestions, loading) => ({
        suggestions,
        loading
    })),
    {
        onFetchSuggestions: fetchSuggestions,
        onClearSuggestions: updateSuggestions.bind(null, [])
    }
)(SearchBar);

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


const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.loading || false
    ], (loading) => ({
        loading
    }))
)(DetailsPanel);

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

function getPageSize(width) {
    if (width < 968) {
        return 'sm';
    }
    if (width < 1400) {
        return 'md';
    }
    return 'lg';
}

function Home({
    location,
    params,
    onSearch,
    onEnableFiltersPanel,
    isFiltersPanelEnabled,
    config,
    hideHero,
    isFilterForm,
    onSelect,
    match,
    user,
    width,
    resource,
    totalResources
}) {

    const {
        menuItemsLeftAllowed,
        menuItemsRightAllowed,
        navbarItemsAllowed,
        filterMenuItemsAllowed,
        footerMenuItemsAllowed,
        cardOptionsItemsAllowed,
        filtersFormItemsAllowed,
        theme,
        filters
    } = config;

    const pageSize = getPageSize(width);
    const isMounted = useRef();
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const brandNavbarNode = useRef();
    const menuIndexNode = useRef();
    const filtersMenuNode = useRef();
    const footerNode = useRef();
    const filterFormNode = useRef();
    const heroNode = useRef();

    const [inViewRef, inView] = useInView();


    const brandNavbarHeight = brandNavbarNode.current
        ? brandNavbarNode.current.getBoundingClientRect().height
        : 0;

    const menuIndexNodeHeight = menuIndexNode.current
        ? menuIndexNode.current.getBoundingClientRect().height
        : 0;
    const filtersMenuNodeHeight = filtersMenuNode.current
        ? filtersMenuNode.current.getBoundingClientRect().height
        : 0;
    const footerNodeHeight = footerNode.current
        ? footerNode.current.getBoundingClientRect().height
        : 0;

    const heroNodeHeight = heroNode.current
        ? heroNode.current.getBoundingClientRect().height
        : 0;


    const dimensions = {
        brandNavbarHeight,
        menuIndexNodeHeight,
        filtersMenuNodeHeight,
        footerNodeHeight,
        heroNodeHeight
    };

    const [isSmallDevice, setIsSmallDevice] = useState(false);
    useEffect(() => {
        setIsSmallDevice((pageSize === 'sm') ? true : false);
    }, [pageSize]);

    const handleShowFilterForm = () => {
        if (!isFilterForm) {
            window.location = `#/search/${location.search}`;
            onEnableFiltersPanel(true);
        } else {
            onEnableFiltersPanel(!isFiltersPanelEnabled);
        }
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
        return hashLocationToHref({
            location,
            ...options
        });
    }

    const { query } = url.parse(location.search, true);

    const queryFilters = Object.keys(query).reduce((acc, key) => key.indexOf('filter') === 0
        ? [...acc, ...castArray(query[key]).map((value) => ({ key, value }))]
        : acc, []);


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

    const search = (
        <ConnectedSearchBar
            key="search"
            value={params.q || ''}
            style={{
                width: '100%',
                maxWidth: 716,
                margin: 'auto'
            }}
            onChange={(value) =>
                handleUpdate({
                    q: value
                }, '/search/')}
        >
        </ConnectedSearchBar>
    );

    const isHeroVisible = !hideHero && inView;
    const stickyFiltersMaxHeight = (window.innerHeight - dimensions.brandNavbarHeight - dimensions.menuIndexNodeHeight - dimensions.footerNodeHeight);
    const filterFormTop = dimensions.brandNavbarHeight + dimensions.menuIndexNodeHeight;

    return (
        <div className={`gn-home gn-theme-${theme?.variant || 'light'}`}>
            <BrandNavbar
                ref={brandNavbarNode}
                logo={castArray(config?.navbar?.logo || [])
                    .map((logo) => ({
                        ...logo,
                        ...logo[pageSize]
                    }))}
                navItems={navbarItemsAllowed}
                inline={pageSize !== 'sm'}
                pageSize={pageSize}
                style={{
                    ...theme?.navbar?.style,
                    width
                }}
            >
                {!isHeroVisible && search}
            </BrandNavbar>
            {!hideHero && <Hero
                ref={heroNode}
                style={{
                    marginTop: dimensions.brandNavbarHeight,
                    ...theme?.hero?.style
                }}
                jumbotronStyle={theme?.jumbotron?.style}
            >
                <div ref={inViewRef}>
                    {isHeroVisible && search}
                </div>
            </Hero>}
            <MenuIndex
                ref={menuIndexNode}
                style={{
                    top: dimensions.brandNavbarHeight,
                    width
                }}
                query={query}
                leftItems={menuItemsLeftAllowed || []}
                rightItems={menuItemsRightAllowed || []}
                formatHref={handleFormatHref}
                tools={<ConnectedLanguageSelector
                    inline={theme?.languageSelector?.inline}
                    style={theme?.languageSelector?.style}
                />}
            />
            <div className="gn-main-home">

                <div className="gn-container">
                    <div className="gn-row">
                        {isMounted.current && isFiltersPanelEnabled && isFilterForm &&  <div ref={filterFormNode} id="gn-filter-form-container" className={`gn-filter-form-container`}>
                            <FiltersForm
                                key="gn-filter-form"
                                id="gn-filter-form"
                                styleContainerForm={ hideHero ? { marginTop: dimensions.brandNavbarHeight, top: filterFormTop, maxHeight: stickyFiltersMaxHeight } :
                                    { top: filterFormTop, maxHeight: stickyFiltersMaxHeight }}
                                fields={filtersFormItemsAllowed}
                                extentProps={filters?.extent}
                                suggestionsRequestTypes={suggestionsRequestTypes}
                                query={query}
                                onChange={isSmallDevice && handleUpdateSmallDevice || handleUpdate}
                                onClose={handleShowFilterForm}
                            />

                        </div>
                        }

                        <div className="gn-grid-container">
                            <ConnectedCardGrid
                                user={user}
                                query={query}
                                pageSize={pageSize}
                                cardOptions={cardOptionsItemsAllowed}
                                isColumnActive={!!resource}
                                buildHrefByTemplate={buildHrefByTemplate}
                                containerStyle={!isHeroVisible
                                    ? {
                                        marginTop: hideHero && dimensions.brandNavbarHeight,
                                        paddingBottom: dimensions.footerNodeHeight
                                    }
                                    : undefined}
                                column={ hideHero &&
                                    <ConnectedDetailsPanel
                                        resource={resource}
                                        filters={queryFilters}
                                        formatHref={handleFormatHref}
                                        sectionStyle={{
                                            width: pageSize === 'lg'
                                                ? 700
                                                : pageSize === 'md'
                                                    ? 600
                                                    : '100%',
                                            ...(!isHeroVisible && {
                                                position: 'fixed',
                                                top: dimensions.brandNavbarHeight + dimensions.menuIndexNodeHeight,
                                                bottom: dimensions.footerNodeHeight,
                                                overflowY: 'scroll',
                                                height: 'auto'
                                            })
                                        }}
                                    />
                                }
                                isCardActive={res => res.pk === pk}
                                page={params.page ? parseFloat(params.page) : 1}
                                formatHref={handleFormatHref}
                                onLoad={(value) => {
                                    handleUpdate({
                                        page: value
                                    });
                                }}
                            >

                                <FiltersMenu
                                    ref={filtersMenuNode}
                                    style={{
                                        top: dimensions.brandNavbarHeight + dimensions.menuIndexNodeHeight
                                    }}
                                    formatHref={handleFormatHref}
                                    cardsMenu={filterMenuItemsAllowed || []}
                                    order={query?.sort}
                                    onClear={handleClear}
                                    onClick={handleShowFilterForm}
                                    orderOptions={filters?.order?.options}
                                    defaultLabelId={filters?.order?.defaultLabelId}
                                    totalResources={totalResources}
                                    filtersActive={!!(queryFilters.length > 0 || query.f || query.extent)}
                                />

                            </ConnectedCardGrid>
                        </div>
                    </div>
                </div>
            </div>
            <Footer
                ref={footerNode}
                footerItems={footerMenuItemsAllowed || []}
                style={theme?.footer?.style}
            />
        </div>
    );
}

Home.propTypes = {
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

Home.defaultProps = {
    background: {},
    logo: [],
    jumbotron: {},
    isFilterForm: true
};

const DEFAULT_PARAMS = {};


const ConnectedHome = connect(

    createSelector([
        state => state?.gnsearch?.params || DEFAULT_PARAMS,
        userSelector,
        state => state?.gnresource?.data || null,
        state => state?.controls?.gnFiltersPanel?.enabled || null,
        getParsedGeoNodeConfiguration,
        state => state?.gnsearch?.total || 0
    ], (params, user, resource, isFiltersPanelEnabled, config, totalResources) => ({
        params,
        user,
        resource,
        isFiltersPanelEnabled,
        config,
        totalResources
    })),
    {
        onSearch: searchResources,
        onSelect: requestResource,
        onEnableFiltersPanel: setControlProperty.bind(null, 'gnFiltersPanel', 'enabled')
    }
)(withResizeDetector(Home));

export default ConnectedHome;
