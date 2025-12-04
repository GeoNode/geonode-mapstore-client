/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import FiltersForm from '@mapstore/framework/plugins/ResourcesCatalog/components/FiltersForm';
import useParsePluginConfigExpressions from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useParsePluginConfigExpressions';
import useFilterFacets from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useFilterFacets';
import { getMonitoredStateSelector } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';


import { userSelector } from '@mapstore/framework/selectors/security';
import { getCatalogFacets } from '@mapstore/framework/api/persistence';
import { isMenuItemSupportedSupported } from '@mapstore/framework/utils/ResourcesUtils';

/**
 * This  renders a  configurable input filters for documents catalog
 * @class
 * @name DocumentsFiltersForm
 * @prop {object[]} cfg.fields array of filter object configurations
 * @example
 */


function DocumentsFiltersForm({
    id = 'ms-filter-form',
    onChange: onSearch,
    onClear,
    query,
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
    fields: fieldsProp =  [
        { type: "select", facet: "category" },
        { type: "select", facet: "keyword" },
        { type: "select", facet: "place" },
        {
            type: "date-range",
            filterKey: "date",
            labelId: "gnviewer.dateFilter"
        },
        {
            labelId: "gnviewer.extent",
            type: "extent"
        }
    ],
    monitoredState,
    show = true,
    user,
    availableResourceTypes = ['MAP', 'DASHBOARD', 'GEOSTORY', 'CONTEXT'],
    onClose
}, context) {

    const parsedConfig = useParsePluginConfigExpressions(monitoredState, {
        extent,
        fields: fieldsProp
    }, context?.plugins?.requires,
    {
        filterFunc: item => isMenuItemSupportedSupported(item, availableResourceTypes, user)
    });

    const {
        fields
    } = useFilterFacets({
        query,
        fields: parsedConfig.fields,
        request: (...args) => getCatalogFacets(...args).toPromise(),
        monitoredState,
        visible: !!show
    }, [user]);

    return (
        <FiltersForm
            id={id}
            extentProps={parsedConfig.extent}
            fields={fields}
            query={query}
            onChange={(params) => onSearch(params)}
            onClear={onClear}
            onClose={onClose}
        />
    );
}

DocumentsFiltersForm.contextTypes = {
    plugins: PropTypes.object
};

const DocumentsFiltersFormConnected = connect(
    createStructuredSelector({
        user: userSelector,
        monitoredState: getMonitoredStateSelector
    }), {}
)(DocumentsFiltersForm);

export default DocumentsFiltersFormConnected;
