/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import url from 'url';
import { createSelector } from 'reselect';
import DetailsPanel from '@js/components/DetailsPanel';
import FiltersMenu from '@js/components/FiltersMenu';
import { getParsedGeoNodeConfiguration } from "@js/selectors/config";
import { userSelector } from '@mapstore/framework/selectors/security';
import { buildHrefByTemplate } from '@js/utils/MenuUtils';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import { processingDownload } from '@js/selectors/resourceservice';
import {
    searchResources,
    requestResource,
    loadFeaturedResources
} from '@js/actions/gnsearch';

import { processResources, setFavoriteResource } from '@js/actions/gnresource';
import {
    hashLocationToHref,
    clearQueryParams,
    getQueryFilters
} from '@js/utils/SearchUtils';
import { withResizeDetector } from 'react-resize-detector';
import MetaTags from "@js/components/MetaTags";

import {
    getThemeLayoutSize
} from '@js/utils/AppUtils';
import { resourceHasPermission } from '@js/utils/ResourceUtils';
import { getTotalResources } from '@js/selectors/search';
import ConnectedCardGrid from '@js/routes/catalogue/ConnectedCardGrid';
import DeleteResource from '@js/plugins/DeleteResource';
import Notifications from '@mapstore/framework/plugins/Notifications';
import SaveAs from '@js/plugins/SaveAs';
const { DeleteResourcePlugin } = DeleteResource;
const { SaveAsPlugin } = SaveAs;
const { NotificationsPlugin } = Notifications;

const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.loading || false,
        state => state?.gnresource?.data?.favorite || false,
        processingDownload,
        state => state?.gnresource?.data || null
    ], (loading, favorite, processing, resource) => ({
        loading,
        favorite,
        processing,
        canDownload: resourceHasPermission(resource, 'download_resourcebase')
    })),
    {
        onFavorite: setFavoriteResource,
        onAction: processResources
    }
)(DetailsPanel);
function Detail({
    location,
    params,
    onSearch,
    onEnableFiltersPanel,
    config,
    onSelect,
    match,
    user,
    width,
    resource,
    totalResources,
    siteName,
    loading
}) {

    const {
        filterMenuItemsAllowed,
        cardOptionsItemsAllowed,
        filters
    } = config;

    const scrollContainer = useRef();
    const themeLayoutSize = getThemeLayoutSize(width);

    const handleShowFilterForm = () => {
        window.location = `#/search/${location.search}`;
        onEnableFiltersPanel(true);
    };

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

    function hrefDetailPanel() {
        return handleFormatHref({
            pathname: '/search/'
        });
    }

    const { query } = url.parse(location.search, true);
    const queryFilters = getQueryFilters(query);

    const pk = match.params.pk;
    const ctype = match.params.ctype;

    useEffect(() => {
        onSelect(pk, ctype);
    }, [pk, ctype]);

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
                {!!resource &&
                <ConnectedDetailsPanel
                    enableFavorite={!!user}
                    resource={resource}
                    linkHref={hrefDetailPanel}
                    formatHref={handleFormatHref}
                />}
            </div>
            <DeleteResourcePlugin
                redirectTo={handleFormatHref({
                    pathname: '/search/'
                }).replace('#', '')}
            />
            <SaveAsPlugin closeOnSave labelId="gnviewer.clone" />
            <NotificationsPlugin />
        </>
    );
}

Detail.propTypes = {
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

Detail.defaultProps = {
    background: {},
    logo: [],
    jumbotron: {},
    isFilterForm: false
};

const DEFAULT_PARAMS = {};


const ConnectedDetail = connect(

    createSelector([
        state => state?.gnsearch?.params || DEFAULT_PARAMS,
        userSelector,
        state => state?.gnresource?.data || null,
        state => state?.controls?.gnFiltersPanel?.enabled || null,
        getParsedGeoNodeConfiguration,
        getTotalResources,
        state => state?.gnsettings?.siteName || "Geonode",
        state => state?.gnsearch?.loading || false
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
)(withResizeDetector(Detail));

export default ConnectedDetail;
