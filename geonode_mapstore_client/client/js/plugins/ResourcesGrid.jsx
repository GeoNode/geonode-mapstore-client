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
import { getTotalResources, getFacetsItems } from '@js/selectors/search';
import { searchResources, setSearchConfig, getFacetItems, setFilters as setFiltersAction } from '@js/actions/gnsearch';

import gnsearch from '@js/reducers/gnsearch';
import gnresource from '@js/reducers/gnresource';
import resourceservice from '@js/reducers/resourceservice';

import gnsearchEpics from '@js/epics/gnsearch';
import gnsaveEpics from '@js/epics/gnsave';
import resourceServiceEpics from '@js/epics/resourceservice';
import favoriteEpics from '@js/epics/favorite';
import DetailsPanel from '@js/components/DetailsPanel';
import { processingDownload } from '@js/selectors/resourceservice';
import { resourceHasPermission, getCataloguePath } from '@js/utils/ResourceUtils';
import {downloadResource, setFavoriteResource} from '@js/actions/gnresource';
import FiltersForm from '@js/components/FiltersForm';
import usePluginItems from '@mapstore/framework/hooks/usePluginItems';
import { ProcessTypes } from '@js/utils/ResourceServiceUtils';
import { replace } from 'connected-react-router';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import useLocalStorage from '@js/hooks/useLocalStorage';
import MainLoader from '@js/components/MainLoader';

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

function PaginationCustom({
    activePage,
    items,
    onSelect
}) {
    const [page, setPage] = useState(activePage);
    function handleSelect(value) {
        setPage(value);
        onSelect(value);
    }
    useEffect(() => {
        if (activePage !== page) {
            setPage(activePage);
        }
    }, [activePage]);
    return (
        <Pagination
            className="custom"
            prev={<FaIcon name="angle-left" />}
            next={<FaIcon name="angle-right" />}
            ellipsis
            boundaryLinks
            items={items}
            maxButtons={3}
            activePage={page}
            onSelect={handleSelect}
        />
    );
}

const removeMenuHighlight = () => {
    // Remove previous higlighted menu
    const menuHiglighted = document.querySelector('#gn-topbar .highlight-menu');
    menuHiglighted?.classList.remove('highlight-menu');
};
const getCatalogPage = (pathname) => {
    const {params: {page} = {}} = matchPath(pathname, { path: "/:page", exact: true }) ?? {};
    return page;
};
const withPageConfig = (Component) => {
    return (props) => {
        useEffect(() => {
            // highlight topbar menu item based on catalog page
            const page = getCatalogPage(props.location.pathname);

            if (page) {
                removeMenuHighlight();

                const topbarMenu = document.querySelector(`#gn-topbar #${page}`);
                topbarMenu?.classList.add('highlight-menu');
            } else {
                removeMenuHighlight();
            }
        }, [props.location.pathname]);

        const mergePropsWithPageConfigs = () => {
            const pageName = getCatalogPage(props.location.pathname, props);
            return {...props, ...props?.[`${pageName}Page`]};
        };

        return <Component {...mergePropsWithPageConfigs()} />;
    };
};

/**
* @module ResourcesGrid
*/

/**
 * renders a grid of resource cards, providing the ability to create pages to show a filtered / curated list of resources. For example, a landing page showing only geostories, one page per category or group with a title, some text, etc.
  * @name ResourcesGrid.
  * @prop {string} defaultQuery The pre-set filter to be applied by default
  * @prop {object} order an object defining sort options for resource grid.
  * @prop {object} extent the extent used in filters side menu to limit search within set bounds.
  * @prop {array} menuItems contains menu for Add resources button.
  * @prop {array} filtersFormItems Provides config for various filter metrics.
  * @prop {string} pagePath provided page url path.
  * @prop {number} pageSize number of resources per page. Used in pagination.
  * @prop {string} targetSelector selector for parent node of resource
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
  * @prop {boolean} enableGeoNodeCardsMenuItems Provides a config to allow for card menu items to be enabled/disabled.
  * @prop {boolean} panel when enabled, the component render the list of resources, filters and details preview inside a panel
  * @prop {string} cardLayoutStyle when specified, the card layout option is forced and the button to toggle card layout is hidden
  * @prop {string} defaultCardLayoutStyle default layout card style. One of 'list'|'grid'
  * @prop {array} detailsTabs array of tab object representing the structure of the displayed info properties (see tabs in {@link module:DetailViewer})
  * @example
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
            disableIf: "{(state('settings') && state('settings').isMobile) || !(state('user') && state('user').perms && state('user').perms.includes('add_resource'))}",
            type: 'dropdown',
            variant: 'primary',
            responsive: true,
            noCaret: true,
            items: [
                {
                    labelId: 'gnhome.uploadDataset',
                    value: 'layer',
                    type: 'link',
                    href: '{context.getCataloguePath("/catalogue/#/upload/dataset")}'
                },
                {
                    labelId: 'gnhome.uploadDocument',
                    value: 'document',
                    type: 'link',
                    href: '{context.getCataloguePath("/catalogue/#/upload/document")}'
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
                    href: '{context.getCataloguePath("/catalogue/#/map/new")}'
                },
                {
                    labelId: 'gnhome.createGeostory',
                    value: 'geostory',
                    type: 'link',
                    href: '{context.getCataloguePath("/catalogue/#/geostory/new")}'
                },
                {
                    labelId: 'gnhome.createDashboard',
                    value: 'dashboard',
                    type: 'link',
                    href: '{context.getCataloguePath("/catalogue/#/dashboard/new")}'
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
            type: 'search'
        },
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
                    id: 'remote',
                    labelId: 'gnhome.remote',
                    type: 'filter'
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
                            id: 'store-time-series',
                            labelId: 'gnhome.timeSeries',
                            type: 'filter'
                        },
                        {
                            id: '3dtiles',
                            labelId: 'gnhome.3dtiles',
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
                    id: 'mapviewer',
                    labelId: 'gnhome.mapviewers',
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
            type: 'select',
            facet: "category"
        },
        {
            type: 'select',
            facet: "keyword"
        },
        {
            type: 'select',
            facet: 'place'
        },
        {
            type: 'select',
            facet: 'user'
        },
        {
            type: 'select',
            facet: "group"
        },
        {
            type: "accordion",
            style: "facet", // style can be facet or filter (checkbox)
            facet: "thesaurus"
        },
        {
            type: 'date-range',
            filterKey: 'date',
            labelId: 'gnviewer.dateFilter'
        },
        {
            labelId: 'gnviewer.extent',
            type: 'extent'
        }
    ],
    pagePath = '',
    pageSize = 24,
    panel,
    cardLayoutStyle = null,
    defaultCardLayoutStyle = 'grid',
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
    pagination,
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
    detailsTabs = [],
    onGetFacets,
    facets,
    filters,
    setFilters,
    ...props
}, context) {

    const [_cardLayoutStyleState, setCardLayoutStyle] = useLocalStorage('layoutCardsStyle', defaultCardLayoutStyle);
    const cardLayoutStyleState = cardLayoutStyle || _cardLayoutStyleState; // Force style when `cardLayoutStyle` is configured

    const isPaginated = pagination !== undefined
        ? pagination
        : cardLayoutStyleState !== 'grid';
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

    const cardOptions = [...configuredItems
        .filter(item => item.target === 'cardOptions')
        .map(({ name, Component }) => ({
            type: 'plugin',
            Component,
            action: name
        }))].sort((a, b) => resourceCardActionsOrder.indexOf(a.action) - resourceCardActionsOrder.indexOf(b.action));

    const detailsToolbarItems = configuredItems
        .filter(item => (item.target === "cardOptions" && item.detailsToolbar) || item.target === "detailsToolbar");

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
            simulateAClick(getCataloguePath(filterPagePath));
        } else {
            if (!isEmpty(resource)) {
                const href = closeDetailPanelHref();
                simulateAClick(href);
            }
            setShowFilterForm(show);
        }
    };

    const isCatalogPage = (pathname) => {
        const isConfigPresent = !!props?.[`${pathname.replace('/', '')}Page`];

        // to be a catalog page it should have configuration
        return getCatalogPage(pathname) && isConfigPresent;
    };

    const getMatchPath = () => {
        const pathname = location.pathname;
        const matchedPath = [
            '/search',
            '/search/filter',
            '/detail/:pk',
            '/detail/:resourceType/:pk',
            '/:page'
        ].find((path) => matchPath(pathname, { path, exact: true }));
        return matchedPath;
    };

    const getUpdatedPathName = (pathname) => {
        if (isEmpty(pathname)) {
            return isCatalogPage(location.pathname) ? location.pathname : '/';
        }
        return pathname;
    };

    function handleUpdate(newParams, pathname) {
        const { query } = url.parse(location.search, true);
        onSearch({
            ...omit(query, ['page']),
            ...newParams
        }, getUpdatedPathName(pathname));
    }

    function handleClear() {
        const newParams = clearQueryParams(location);
        handleUpdate(newParams);
    }

    const [init, setInit] = useState(false);

    // check if page query exist
    // if the pagination is undefined
    useEffect(() => {
        if (!init) {
            const { query } = url.parse(location.search, true);
            if (pagination === undefined && query.page) {
                setCardLayoutStyle(cardLayoutStyle || 'list');
            }
            setInit(true);
        }
    }, [cardLayoutStyle]);

    useEffect(() => {
        let pathname = location.pathname;
        const initialize = (pathname === '/'
        || !isEmpty(getMatchPath())
        || isCatalogPage(pathname)) && init;

        if (initialize) {
            pathname = getUpdatedPathName();
            onInit({
                defaultQuery,
                pageSize,
                pagination: isPaginated
            });
            const scrollNode = scrollContainerSelector ? document.querySelector(scrollContainerSelector) : null;
            if (scrollNode) {
                scrollNode.scrollTop = 0;
            }
            const { query } = url.parse(location.search, true);
            const page = isPaginated && !query.page && params.page
                ? params.page
                : query.page;
            onSearch({
                ...query,
                ...(page && { page })
            }, pathname, true);
        }
    }, [init, isPaginated, location.pathname]);

    const [top, setTop] = useState(0);
    const [bottom, setBottom] = useState(0);
    useEffect(() => {
        if (!panel) {
            const header = headerNodeSelector ? document.querySelector(headerNodeSelector) : null;
            const navbar = navbarNodeSelector ? document.querySelector(navbarNodeSelector) : null;
            const footer = footerNodeSelector ? document.querySelector(footerNodeSelector) : null;
            const { height: headerHeight = 0 } = header?.getBoundingClientRect() || {};
            const { height: navbarHeight = 0 } = navbar?.getBoundingClientRect() || {};
            const { height: footerHeight = 0 } = footer?.getBoundingClientRect() || {};
            setTop(headerHeight + navbarHeight);
            setBottom(footerHeight);
        }
    }, [width, height, panel]);

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
    const { height: containerHeight } = container?.getBoundingClientRect() || {};
    useEffect(() => {
        if (container && !panel) {
            container.style.width = `calc(100% - ${panelsWidth}px)`;
            container.style.marginLeft = `${filterFormWidth}px`;
        }
    }, [container, panelsWidth, filterFormWidth, panel]);

    useEffect(() => {
        if (!panel) {
            const pathname = location.pathname;
            const matchedPath = getMatchPath();
            if (matchedPath) {
                const options = matchPath(pathname, { path: matchedPath, exact: true });
                !isCatalogPage(location.pathname) && onReplaceLocation('' + (location.search || ''));
                switch (options.path) {
                case '/search':
                case '/detail/:pk': {
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
        }
    }, [location.pathname, panel]);

    const filterForm = !disableFilters && (
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
                {showFilterForm && <FiltersForm
                    key="gn-filter-form"
                    id="gn-filter-form"
                    fields={parsedConfig.filtersFormItems}
                    facets={facets}
                    extentProps={parsedConfig.extent}
                    query={query}
                    onChange={handleUpdate}
                    onClose={handleShowFilterForm.bind(null, false)}
                    onClear={handleClear}
                    onGetFacets={onGetFacets}
                    filters={filters}
                    setFilters={setFilters}
                />}
            </div>
        </div>
    );

    const detailPanel = !disableDetailPanel && (
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
                    toolbarItems={detailsToolbarItems}
                />}
            </div>
        </div>
    );

    return (
        <>
            <Portal targetSelector={targetSelector}>
                <>
                    <div
                        className={`gn-resources-grid gn-${panel ? 'panel' : 'row'}`}
                        style={(container || panel) ? {} : {
                            width: `calc(100% - ${panelsWidth}px)`,
                            marginLeft: filterFormWidth
                        }}
                    >
                        <div className="gn-grid-container">
                            <ConnectedCardGrid
                                fixed={isPaginated}
                                cardLayoutStyle={cardLayoutStyleState}
                                containerStyle={panel
                                    ? { maxWidth: '100%' }
                                    : {...((containerHeight && isPaginated) && { minHeight: containerHeight })}
                                }
                                header={
                                    <FiltersMenu
                                        formatHref={handleFormatHref}
                                        cardsMenu={parsedConfig.menuItems || []}
                                        order={query?.sort}
                                        onClear={handleClear}
                                        onClick={handleShowFilterForm.bind(null, true)}
                                        orderConfig={parsedConfig.order}
                                        totalResources={totalResources}
                                        totalFilters={queryFilters.length}
                                        filtersActive={!!(queryFilters.length > 0)}
                                        loading={loading}
                                        cardLayoutStyle={cardLayoutStyleState}
                                        setCardLayoutStyle={setCardLayoutStyle}
                                        style={{
                                            position: 'sticky',
                                            top
                                        }}
                                        hideCardLayoutButton={!!cardLayoutStyle}
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
                                            : (!loading || !!totalResources) && <PaginationCustom
                                                items={Math.ceil(totalResources / pageSize)}
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
                                        'd': `${res.pk};${res.resource_type}${res.subtype ? `;${res.subtype}` : ''}`
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
                        {
                            panel && <>
                                {filterForm}
                                {detailPanel}
                            </>
                        }
                    </div>
                    {loading && (totalResources || 0) === 0 ? <MainLoader className="gn-main-grid-loader"/> : null}
                </>
            </Portal>
            {!panel && <>
                {createPortal(filterForm, document.querySelector('body > div'))}
                {createPortal(detailPanel, document.querySelector('body > div'))}
            </>}
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
        state => state?.gnsearch?.error,
        getFacetsItems,
        state => state?.gnsearch?.filters
    ], (params, user, totalResources, loading, location, resource, monitoredState, error, facets, filters) => ({
        params,
        user,
        totalResources,
        loading,
        location,
        resource,
        monitoredState,
        error,
        facets,
        filters
    })),
    {
        onSearch: searchResources,
        onInit: setSearchConfig,
        onReplaceLocation: replace,
        onGetFacets: getFacetItems,
        setFilters: setFiltersAction
    }
)(withResizeDetector(withPageConfig(ResourcesGrid)));

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
