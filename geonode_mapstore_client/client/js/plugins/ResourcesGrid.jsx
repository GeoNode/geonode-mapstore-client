/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import { Pagination } from 'react-bootstrap';
import { matchPath } from 'react-router-dom';
import {
    createPlugin,
    getMonitoredState
} from '@mapstore/framework/utils/PluginsUtils';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { connect } from 'react-redux';
import url from 'url';
import { createSelector } from 'reselect';
import FiltersMenu from '@js/components/FiltersMenu';
import { buildHrefByTemplate, parsePluginConfigExpressions } from '@js/utils/MenuUtils';
import {
    hashLocationToHref,
    clearQueryParams,
    getQueryFilters
} from '@js/utils/SearchUtils';
import { withResizeDetector } from 'react-resize-detector';
import { userSelector } from '@mapstore/framework/selectors/security';
import ConnectedCardGrid from '@js/plugins/resourcesgrid/ConnectedCardGrid';
import { getTotalResources } from '@js/selectors/search';
import { searchResources, setSearchConfig } from '@js/actions/gnsearch';

import gnsearch from '@js/reducers/gnsearch';
import gnresource from '@js/reducers/gnresource';
import resourceservice from '@js/reducers/resourceservice';

import gnsearchEpics from '@js/epics/gnsearch';
import gnsaveEpics from '@js/epics/gnsave';
import resourceServiceEpics from '@js/epics/resourceservice';
import favoriteEpics from '@js/epics/favorite';
import DetailsPanel from '@js/components/DetailsPanel';
import { processingDownload } from '@js/selectors/resourceservice';
import { resourceHasPermission } from '@js/utils/ResourceUtils';
import { downloadResource, setFavoriteResource } from '@js/actions/gnresource';
import FiltersForm from '@js/components/FiltersForm';
import { getCategories, getRegions, getOwners, getKeywords } from '@js/api/geonode/v2';
import usePluginItems from '@js/hooks/usePluginItems';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { replace } from 'connected-react-router';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';

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

const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.loading || false,
        state => state?.gnresource?.data?.favorite || false,
        processingDownload,
        state => state?.gnresource?.data || null
    ], (loading, favorite, downloading, resource) => ({
        loading,
        favorite: favorite,
        downloading,
        canDownload: resourceHasPermission(resource, 'download_resourcebase'),
        resourceId: resource?.pk
    })),
    {
        onFavorite: setFavoriteResource,
        onAction: downloadResource
    }
)(DetailsPanel);

function Portal({ targetSelector = '', children }) {
    const parent = targetSelector ? document.querySelector(targetSelector) : null;
    if (parent) {
        return createPortal(children, parent);
    }
    return <>{children}</>;
}

const simulateAClick = (href) => {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.click();
};

/**
  * @name ResourcesGrid
  * @memberof plugins
  * ResourcesGrid Plugin. Renders a grid of resource cards, providing the ability to create pages to show a filtered / curated list of resources. For example, a landing page showing only geostories, one page per category or group with a title, some text, etc.
  * @prop {object} location url utils of current location provided by Router.
  * @prop {object} params url query parameters.
  * @prop {function} onSearch an action to update state with search parameters.
  * @prop {object} user user object. Will be set as null for anonymous users.
  * @prop {number} totalResources total number of resources avaiable on server. If a filter is applied, this number represents the total number of such resources.
  * @prop {boolean} loading loading state of page. This is true when resources are being queries and false when server response is received.
  * @prop {string} defaultQuery The pre-set filter to be applied by default
  * @prop {object} order an object defining sort options for resource grid.
  * @prop {object} extent the extent used in filters side menu to limit search within set bounds.
  * @prop {array} menuItems contains menu for Add resources button.
  * @prop {array} filtersFormItems Provides config for various filter metrics.
  * @prop {string} pagePath provided page url path.
  * @prop {number} pageSize number of resources per page. Used in pagination.
  * @prop {object} resource Selected resource to be viewed in detail. Empty when no resource is selected
  * @prop {number} width The width of a resource card.
  * @prop {number} height The height of a resource card.
  * @prop {array} items list of actions for each resource depending on perms
  * @prop {string} targetSelector selector for parent node of resource
  * @prop {function} onInit Function to be executed when plugin is first loaded. It sets the state with search configurations.
  * @prop {object} monitoredState Provides various properties for monitoring state of client and resources
  * @prop {string} headerNodeSelector selector for rendered header.
  * @prop {string} navbarNodeSelector selector for rendered navbar.
  * @prop {string} footerNodeSelector selector for rendered footer.
  * @prop {string} containerSelector selector for rendered resource card grid container.
  * @prop {string} scrollContainerSelector selector for outer container of resource cards rendered. This is the parent on which scrolling takes place.
  * @prop {boolean} pagination Provides a config to allow for pagination
  * @prop {boolean} disableDetailPanel Provides a config to allow resource details to be viewed when selected.
  * @prop {boolean} disableFilters Provides a config to enable/disable filtering of resources
  * @prop {string} filterPagePath sets path for filters page when filter button is clicked
  * @prop {array} resourceCardActionsOrder order in which `cfg.items` will be rendered
  * @prop {function} onReplaceLocation replace function
  * @prop {boolean} error error state in case of an error.
  * @prop {boolean} enableGeoNodeCardsMenuItems Provides a config to allow for card menu items to be enabled/disabled.
  * @example
  *
  * Typical configuration of the plugin
  *
  * {
  *   "name": "ResourcesGrid",
  *    "cfg": {
  *        targetSelector: '#custom-resources-grid',
  *        containerSelector: '.gn-container',
  *        menuItems: [],
  *        filtersFormItems: [],
  *        defaultQuery: {
  *          f: 'dataset'
  *        },
  *        pagePath: '/catalogue/',
  *        pagination: false,
  *        disableDetailPanel: true,
  *        disableFilters: true,
  *        enableGeoNodeCardsMenuItems: true
  *    }
  * }
  */

function ResourcesGrid({
    location,
    params,
    onSearch,
    user,
    totalResources,
    loading,
    defaultQuery,
    order = {
        defaultLabelId: 'gnhome.orderBy',
        options: [
            {
                label: 'Most recent',
                labelId: 'gnhome.mostRecent',
                value: '-date'
            },
            {
                label: 'Less recent',
                labelId: 'gnhome.lessRecent',
                value: 'date'
            },
            {
                label: 'A Z',
                labelId: 'gnhome.aZ',
                value: 'title'
            },
            {
                label: 'Z A',
                labelId: 'gnhome.zA',
                value: '-title'
            },
            {
                label: 'Most popular',
                labelId: 'gnhome.mostPopular',
                value: 'popular_count'
            }
        ]
    },
    extent = {
        layers: [
            {
                type: 'osm',
                title: 'Open Street Map',
                name: 'mapnik',
                source: 'osm',
                group: 'background',
                visibility: true
            }
        ],
        style: {
            color: '#397AAB',
            opacity: 0.8,
            fillColor: '#397AAB',
            fillOpacity: 0.4,
            weight: 4
        }
    },
    menuItems = [
        {
            labelId: 'gnhome.addResource',
            disableIf: "{(state('settings') && state('settings').isMobile) || !(state('user') && state('user').perms && state('user').perms.includes('add_resource')) ? true : false}",
            type: 'dropdown',
            variant: 'primary',
            responsive: true,
            items: [
                {
                    labelId: 'gnhome.uploadDataset',
                    value: 'layer',
                    type: 'link',
                    href: '/catalogue/#/upload/dataset'
                },
                {
                    labelId: 'gnhome.uploadDocument',
                    value: 'document',
                    type: 'link',
                    href: '/catalogue/#/upload/document'
                },
                {
                    labelId: 'gnhome.createDataset',
                    value: 'layer',
                    type: 'link',
                    href: '/createlayer/',
                    disableIf: "{(state('settings') && state('settings').createLayer) ? false : true}"
                },
                {
                    labelId: 'gnhome.createMap',
                    value: 'map',
                    type: 'link',
                    href: '/catalogue/#/map/new'
                },
                {
                    labelId: 'gnhome.createGeostory',
                    value: 'geostory',
                    type: 'link',
                    href: '/catalogue/#/geostory/new'
                },
                {
                    labelId: 'gnhome.createDashboard',
                    value: 'dashboard',
                    type: 'link',
                    href: '/catalogue/#/dashboard/new'
                },
                {
                    labelId: 'gnhome.remoteServices',
                    value: 'remote',
                    type: 'link',
                    href: '/services/?limit=5'
                }
            ]
        },
        {
            type: 'divider'
        }
    ],
    filtersFormItems = [
        {
            type: 'group',
            labelId: 'gnhome.customFiltersTitle',
            items: [
                {
                    id: 'my-resources',
                    labelId: 'gnhome.myResources',
                    type: 'filter',
                    disableIf: '{!state("user")}'
                },
                {
                    id: 'favorite',
                    labelId: 'gnhome.favorites',
                    type: 'filter',
                    disableIf: '{!state("user")}'
                },
                {
                    id: 'featured',
                    labelId: 'gnhome.featuredList',
                    type: 'filter'
                },
                {
                    id: 'unpublished',
                    labelId: 'gnhome.unpublished',
                    type: 'filter',
                    disableIf: '{!state("user")}'
                },
                {
                    id: 'pending-approval',
                    labelId: 'gnhome.pendingApproval',
                    type: 'filter',
                    disableIf: '{!state("user")}'
                },
                {
                    id: 'dataset',
                    labelId: 'gnhome.datasets',
                    type: 'filter',
                    items: [
                        {
                            id: 'store-vector',
                            labelId: 'gnhome.vector',
                            type: 'filter'
                        },
                        {
                            id: 'store-raster',
                            labelId: 'gnhome.raster',
                            type: 'filter'
                        },
                        {
                            id: 'store-remote',
                            labelId: 'gnhome.remote',
                            type: 'filter'
                        },
                        {
                            id: 'store-time-series',
                            labelId: 'gnhome.timeSeries',
                            type: 'filter'
                        }
                    ]
                },
                {
                    id: 'document',
                    labelId: 'gnhome.documents',
                    type: 'filter'
                },
                {
                    id: 'map',
                    labelId: 'gnhome.maps',
                    type: 'filter'
                },
                {
                    id: 'geostory',
                    labelId: 'gnhome.geostories',
                    type: 'filter'
                },
                {
                    id: 'dashboard',
                    labelId: 'gnhome.dashboards',
                    type: 'filter'
                }
            ]
        },
        {
            type: 'divider',
            disableIf: '{!state("user")}'
        },
        {
            labelId: 'gnhome.categories',
            placeholderId: 'gnhome.categoriesPlaceholder',
            type: 'select',
            suggestionsRequestKey: 'categories'
        },
        {
            labelId: 'gnhome.keywords',
            placeholderId: 'gnhome.keywordsPlaceholder',
            type: 'select',
            suggestionsRequestKey: 'keywords'
        },
        {
            labelId: 'gnhome.regions',
            placeholderId: 'gnhome.regionsPlaceholder',
            type: 'select',
            suggestionsRequestKey: 'regions'
        },
        {
            labelId: 'gnhome.owners',
            placeholderId: 'gnhome.ownersPlaceholder',
            type: 'select',
            suggestionsRequestKey: 'owners'
        }
    ],
    pagePath = '',
    pageSize = 24,
    resource,
    width,
    height,
    items,
    targetSelector = '',
    onInit,
    monitoredState,
    headerNodeSelector = '.gn-main-header',
    navbarNodeSelector = '#gn-topbar',
    footerNodeSelector = '.gn-footer',
    containerSelector = '',
    scrollContainerSelector = '',
    pagination = true,
    disableDetailPanel,
    disableFilters,
    filterPagePath = '/catalogue/#/search/filter',
    resourceCardActionsOrder = [
        ProcessTypes.DELETE_RESOURCE,
        ProcessTypes.COPY_RESOURCE,
        'downloadResource'
    ],
    onReplaceLocation,
    error,
    enableGeoNodeCardsMenuItems,
    detailsTabs = []
}, context) {

    const customCardsMenuItems = enableGeoNodeCardsMenuItems ? getConfigProp('geoNodeCardsMenuItems') || [] : [];
    const parsedConfig = parsePluginConfigExpressions(monitoredState, {
        menuItems: [...customCardsMenuItems, ...menuItems],
        filtersFormItems,
        extent,
        order,
        detailsTabs
    });

    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins }, []);

    const cardOptions = [...configuredItems.map(({ name, Component }) => ({
        type: 'plugin',
        Component,
        action: name
    }))].sort((a, b) => resourceCardActionsOrder.indexOf(a.action) - resourceCardActionsOrder.indexOf(b.action));

    const updatedLocation = useRef();
    updatedLocation.current = location;
    function handleFormatHref(options) {
        return pagePath + hashLocationToHref({
            location: updatedLocation.current,
            excludeQueryKeys: ['page'],
            ...options
        });
    }

    const closeDetailPanelHref = () => handleFormatHref({
        query: {
            d: ''
        },
        replaceQuery: true,
        excludeQueryKeys: []
    });

    const [_showFilterForm, setShowFilterForm] = useState(false);
    const showDetail = !isEmpty(resource);
    const showFilterForm = _showFilterForm && !showDetail;

    const handleShowFilterForm = (show) => {
        if (show && disableFilters) {
            simulateAClick(filterPagePath);
        } else {
            if (!isEmpty(resource)) {
                const href = closeDetailPanelHref();
                simulateAClick(href);
            }
            setShowFilterForm(show);
        }
    };

    function handleUpdate(newParams, pathname) {
        const { query } = url.parse(location.search, true);
        onSearch({
            ...omit(query, ['page']),
            ...newParams
        }, pathname);
    }

    function handleClear() {
        const newParams = clearQueryParams(location);
        handleUpdate(newParams);
    }

    useEffect(() => {
        onInit({
            defaultQuery,
            pageSize,
            pagination
        });
        const { query } = url.parse(location.search, true);
        onSearch({
            ...query
        }, undefined, true);
    }, []);

    const [top, setTop] = useState(0);
    const [bottom, setBottom] = useState(0);
    useEffect(() => {
        const header = headerNodeSelector ? document.querySelector(headerNodeSelector) : null;
        const navbar = navbarNodeSelector ? document.querySelector(navbarNodeSelector) : null;
        const footer = footerNodeSelector ? document.querySelector(footerNodeSelector) : null;
        const { height: headerHeight = 0 } = header?.getBoundingClientRect() || {};
        const { height: navbarHeight = 0 } = navbar?.getBoundingClientRect() || {};
        const { height: footerHeight = 0 } = footer?.getBoundingClientRect() || {};
        setTop(headerHeight + navbarHeight);
        setBottom(footerHeight);
    }, [width, height]);

    const { query } = url.parse(location.search, true);
    const queryFilters = getQueryFilters(query);
    const detailNode = useRef();
    const filterFormNode = useRef();
    const { width: filterFormNodeWidth = 0 } = filterFormNode?.current?.getBoundingClientRect() || {};
    const { width: detailNodeWidth = 0 } = detailNode?.current?.getBoundingClientRect() || {};
    const filterFormWidth = showFilterForm ? filterFormNodeWidth : 0;
    const detailWidth = showDetail ? detailNodeWidth : 0;
    const panelsWidth = filterFormWidth + detailWidth;
    const container = containerSelector ? document.querySelector(containerSelector) : null;
    useEffect(() => {
        if (container) {
            container.style.width = `calc(100% - ${panelsWidth}px)`;
            container.style.marginLeft = `${filterFormWidth}px`;
        }
    }, [container, panelsWidth, filterFormWidth]);

    useEffect(() => {
        const pathname = location.pathname;
        const matchedPath = [
            '/search',
            '/search/filter',
            '/detail/:pk',
            '/detail/:resourceType/:pk'
        ].find((path) => matchPath(pathname, { path, exact: true }));
        if (matchedPath) {
            const options = matchPath(pathname, { path: matchedPath, exact: true });
            onReplaceLocation('' + (location.search || ''));
            switch (options.path) {
            case '/search':
            case '/detail/:pk': {
                //
                break;
            }
            case '/search/filter': {
                handleShowFilterForm(true);
                break;
            }
            case '/detail/:resourceType/:pk': {
                const { query: locationQuery } = url.parse(location.search, true);
                const search = url.format({ query: {
                    ...locationQuery,
                    d: `${options?.params?.pk};${options?.params?.resourceType}`
                }});
                simulateAClick('#' + (search || ''));
                break;
            }
            default:
                break;
            }
        }
    }, [location.pathname]);

    return (
        <>
            <Portal targetSelector={targetSelector}>
                <div
                    className="gn-resources-grid gn-row"
                    style={container ? {} : {
                        width: `calc(100% - ${panelsWidth}px)`,
                        marginLeft: filterFormWidth
                    }}
                >
                    <div className="gn-grid-container">
                        <ConnectedCardGrid
                            fixed={pagination}
                            header={
                                <FiltersMenu
                                    formatHref={handleFormatHref}
                                    cardsMenu={parsedConfig.menuItems || []}
                                    order={query?.sort}
                                    onClear={handleClear}
                                    onClick={handleShowFilterForm.bind(null, true)}
                                    orderOptions={parsedConfig.order?.options}
                                    defaultLabelId={parsedConfig.order?.defaultLabelId}
                                    totalResources={totalResources}
                                    totalFilters={queryFilters.length}
                                    filtersActive={!!(queryFilters.length > 0)}
                                    loading={loading}
                                    style={{
                                        position: 'sticky',
                                        top
                                    }}
                                />
                            }
                            footer={
                                <div
                                    className="gn-resources-pagination"
                                    style={{
                                        position: 'sticky',
                                        bottom
                                    }}
                                >
                                    {error
                                        ? <Button variant="primary" href="#/"><FaIcon name="refresh" /></Button>
                                        : (!loading || !!totalResources) && <Pagination
                                            prev
                                            next
                                            first
                                            last
                                            ellipsis
                                            boundaryLinks
                                            bsSize="xs"
                                            items={Math.ceil(totalResources / pageSize)}
                                            maxButtons={3}
                                            activePage={params.page ? parseFloat(params.page) : 1}
                                            onSelect={(value) => {
                                                handleUpdate({
                                                    page: value
                                                });
                                            }}
                                        />}
                                </div>
                            }
                            user={user}
                            query={query}
                            cardOptions={cardOptions}
                            buildHrefByTemplate={buildHrefByTemplate}
                            page={params.page ? parseFloat(params.page) : 1}
                            formatHref={handleFormatHref}
                            isCardActive={res => res.pk === resource?.pk}
                            scrollContainer={scrollContainerSelector ? document.querySelector(scrollContainerSelector) : undefined}
                            getDetailHref={res => handleFormatHref({
                                query: {
                                    'd': `${res.pk};${res.resource_type}`
                                },
                                replaceQuery: true,
                                excludeQueryKeys: []
                            })}
                            onLoad={(value) => {
                                handleUpdate({
                                    page: value
                                });
                            }}
                        />
                    </div>
                </div>
            </Portal>
            {!disableFilters && createPortal(
                <div
                    className="gn-resources-panel-wrapper"
                    style={{
                        top,
                        bottom,
                        visibility: showFilterForm ? 'visible' : 'hidden'
                    }}
                >
                    <div
                        ref={filterFormNode}
                        className="gn-resources-filter"
                    >
                        <FiltersForm
                            key="gn-filter-form"
                            id="gn-filter-form"
                            fields={parsedConfig.filtersFormItems}
                            extentProps={parsedConfig.extent}
                            suggestionsRequestTypes={suggestionsRequestTypes}
                            query={query}
                            onChange={handleUpdate}
                            onClose={handleShowFilterForm.bind(null, false)}
                            onClear={handleClear}
                        />
                    </div>
                </div>,
                document.querySelector('body > div'))}
            {!disableDetailPanel && createPortal(
                <div
                    className="gn-resources-panel-wrapper"
                    style={{
                        top,
                        bottom,
                        visibility: showDetail ? 'visible' : 'hidden'
                    }}
                >
                    <div
                        ref={detailNode}
                        className="gn-resource-detail"
                    >
                        {!isEmpty(resource) && <ConnectedDetailsPanel
                            key={`${resource.pk}:${resource.resource_type}`}
                            enableFavorite={!!user}
                            resource={resource}
                            linkHref={closeDetailPanelHref}
                            formatHref={handleFormatHref}
                            tabs={parsedConfig.detailsTabs}
                        />}
                    </div>
                </div>,
                document.querySelector('body > div'))}
        </>
    );
}


const DEFAULT_PARAMS = {};

const ResourcesGridPlugin = connect(
    createSelector([
        state => state?.gnsearch?.params || DEFAULT_PARAMS,
        userSelector,
        getTotalResources,
        state => state?.gnsearch?.loading || false,
        state => state?.router?.location,
        state => state?.gnresource?.data || null,
        state => getMonitoredState(state, getConfigProp('monitorState')),
        state => state?.gnsearch?.error
    ], (params, user, totalResources, loading, location, resource, monitoredState, error) => ({
        params,
        user,
        totalResources,
        loading,
        location,
        resource,
        monitoredState,
        error
    })),
    {
        onSearch: searchResources,
        onInit: setSearchConfig,
        onReplaceLocation: replace
    }
)(withResizeDetector(ResourcesGrid));

export default createPlugin('ResourcesGrid', {
    component: ResourcesGridPlugin,
    containers: {},
    epics: {
        ...gnsearchEpics,
        ...gnsaveEpics,
        ...resourceServiceEpics,
        ...favoriteEpics
    },
    reducers: {
        gnsearch,
        gnresource,
        resourceservice
    }
});
