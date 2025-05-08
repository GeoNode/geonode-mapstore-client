
/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import url from 'url';
import { connect } from 'react-redux';
import { createSelector, createStructuredSelector } from 'reselect';
import {
    editThumbnailResource,
    setMapThumbnail,
    setResourceThumbnail,
    enableMapThumbnailViewer
} from '@js/actions/gnresource';
import {
    isThumbnailChanged,
    updatingThumbnailResource
} from '@js/selectors/resource';
import Message from '@mapstore/framework/components/I18N/Message';
import { mapSelector } from '@mapstore/framework/selectors/map';
import DetailsInfo from '@mapstore/framework/plugins/ResourcesCatalog/components/DetailsInfo';
import { replaceResourcePaths } from '@mapstore/framework/utils/GeostoreUtils';
import Text from '@mapstore/framework/components/layout/Text';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import DetailsPreview from '../components/DetailsPreview';
import DetailsHeader from '@mapstore/framework/plugins/ResourcesCatalog/components/DetailsHeader';
import DetailsToolbar from '../components/DetailsToolbar';
import moment from 'moment';
import DetailsThumbnail from '../components/DetailsThumbnail';
import ALink from '@mapstore/framework/plugins/ResourcesCatalog/components/ALink';
import { parseCatalogResource } from '@js/utils/ResourceUtils';
import useParsePluginConfigExpressions from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useParsePluginConfigExpressions';
import { hashLocationToHref } from '@mapstore/framework/utils/ResourcesFiltersUtils';
import { getMonitoredStateSelector, getRouterLocation } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';

const ConnectedDetailsThumbnail = connect(
    createSelector([
        state => state?.gnresource?.showMapThumbnail || false,
        mapSelector,
        state => state?.gnsave?.savingThumbnailMap || false,
        isThumbnailChanged,
        updatingThumbnailResource
    ], (showMapThumbnail, map, savingThumbnailMap, thumbnailChanged, resourceThumbnailUpdating) => ({
        enableMapViewer: showMapThumbnail,
        initialBbox: map?.bbox,
        savingThumbnailMap,
        isThumbnailChanged: thumbnailChanged,
        resourceThumbnailUpdating
    })),
    {
        onEnableMapThumbnailViewer: enableMapThumbnailViewer,
        onMapThumbnail: setMapThumbnail,
        onChange: editThumbnailResource,
        onResourceThumbnail: setResourceThumbnail
    }
)(DetailsThumbnail);

function DetailsPanel({
    resource: resourceProp,
    loading,
    toolbarItems,
    onClose,
    editing,
    enableFilters,
    enablePreview,
    tabs,
    tabComponents,
    resourcesGridId,
    monitoredState,
    location,
    panelRef
}, context) {

    const resource = parseCatalogResource(resourceProp);
    const parsedConfig = useParsePluginConfigExpressions(monitoredState, { tabs }, context?.plugins?.requires);

    const { query } = url.parse(location.search, true);
    const updatedLocation = useRef();
    updatedLocation.current = location;
    function handleFormatHref(options) {
        return hashLocationToHref({
            location: updatedLocation.current,
            excludeQueryKeys: ['page'],
            ...options
        });
    }

    return (
        <div className="ms-details-panel" ref={panelRef}>
            <DetailsHeader
                resource={resource}
                loading={loading}
                tools={<DetailsToolbar
                    resource={resource}
                    items={toolbarItems}
                />}
                onClose={onClose}
                thumbnailComponent={ConnectedDetailsThumbnail}
                editing={editing}
            >
                <Text classNames={['_padding-lr-md', '_padding-b-md']} fontSize="sm">
                    <Message msgId="gnviewer.resourceOrigin.a" />
                    {' '}
                    {enableFilters ? <ALink href={handleFormatHref({ query: { 'f': resource.resource_type } })}>
                        {resource.resource_type}
                    </ALink> : <Text component="span" strong>{resource.resource_type}</Text>}
                    {' '}
                    <Message msgId="gnviewer.resourceOrigin.from" />
                    {' '}
                    {resource?.owner?.avatar
                        ? <img src={resource?.owner.avatar} alt={resource?.owner?.username} className="ms-resource-icon-logo" />
                        : null}
                    {' '}
                    {enableFilters ? <ALink href={handleFormatHref({ query: { 'filter{owner.pk.in}': `${resource?.owner?.pk}` } })}>
                        {resource?.owner?.username}
                    </ALink> : <Text component="span" strong>{resource?.owner?.username}</Text>}
                    {(resource?.date_type && resource?.date) ? <>{' '}/{' '}{moment(resource.date).format('MMMM Do YYYY')}</> : null}
                </Text>
                {resource?.abstract
                    ? <Text classNames={['_padding-sm']} dangerouslySetInnerHTML={{ __html: resource?.abstract }} />
                    : null}
                {enablePreview ? <DetailsPreview
                    resource={resource}
                /> : null}
            </DetailsHeader>
            {!loading ? <DetailsInfo
                className="_padding-lr-md"
                key={resource?.pk || resource?.id}
                tabs={replaceResourcePaths(parsedConfig.tabs, resource, [])}
                tabComponents={tabComponents}
                query={query}
                formatHref={handleFormatHref}
                resourcesGridId={resourcesGridId}
                resource={resource || {}}
                enableFilters={enableFilters}
                editing={editing}
            /> : null}
            {(loading) ? <FlexBox centerChildren classNames={['_absolute', '_fill', '_overlay', '_corner-tl']}>
                <Text fontSize="xxl">
                    <Spinner />
                </Text>
            </FlexBox> : null}
        </div>
    );
}

DetailsPanel.contextTypes = {
    plugins: PropTypes.object
};

const ConnectedDetailsPanel = connect(
    createStructuredSelector({
        monitoredState: getMonitoredStateSelector,
        location: getRouterLocation
    })
)(DetailsPanel);

export default ConnectedDetailsPanel;
