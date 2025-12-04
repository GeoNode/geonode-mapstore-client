/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { Glyphicon, Checkbox, FormGroup } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import Loader from '@mapstore/framework/components/misc/Loader';
import ResourceCard from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourceCard';
import FiltersForm from './DocumentsFiltersForm';
import FlexBox, { FlexFill } from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import PaginationCustom from '@mapstore/framework/plugins/ResourcesCatalog/components/PaginationCustom';
import ResourcesMenu from '../components/ResourcesMenu';
import InputControl from '@mapstore/framework/plugins/ResourcesCatalog/components/InputControl';
import ResourcesPanelWrapper from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourcesPanelWrapper';
import ReactSelect from 'react-select';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
import { createStructuredSelector } from 'reselect';
import useQueryDocumentsState from '../hooks/useQueryResourcesByParams';
import { isMenuItemSupportedSupported } from '@mapstore/framework/utils/ResourcesUtils';
import { getDocuments } from '@js/api/geonode/v2';
import useParsePluginConfigExpressions from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useParsePluginConfigExpressions';
import { userSelector } from '@mapstore/framework/selectors/security';
import { getMonitoredStateSelector } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import { documentsToLayerConfig } from '@js/plugins/DocumentsCatalog/utils';


const SelectSync = localizedProps('placeholder')(ReactSelect);

const checkbox_style = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 10,
    borderRadius: '4px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const extension_field = {
    type: "select",
    facet: "extension",
    labelId: "Extension",
    label: "Extension",
    placeholderId: "Filter by extension",
    description: "extension",
    options: [
        { label: "png", value: "png" },
        { label: "jpg", value: "jpg" }
    ],
    filterKey: `filter{extension.in}`
};

const FilterButton = ({ onClick, active, hasActiveFilters }) => (
    <Button
        variant={active ? 'success' : 'primary'}
        onClick={onClick}
        square
        className={hasActiveFilters ? 'ms-notification-circle success' : ''}
    >
        <Glyphicon glyph="filter" />
    </Button>
);


const DocumentResourceItem = ({ entry, isChecked, onToggle }) => (
    <li key={entry.pk} style={{ position: 'relative' }}>
        <div style={checkbox_style} onClick={(e) => e.stopPropagation()}>
            <Checkbox
                checked={isChecked}
                onChange={(event) => {
                    event.stopPropagation();
                    onToggle(entry, event.target.checked);
                }}
                style={{ margin: 0, padding: 0 }}
            />
        </div>
        <ResourceCard
            data={{
                ...entry,
                '@extras': {
                    info: {
                        thumbnailUrl: entry?.thumbnail_url
                    }
                }
            }}
            readOnly
            onClick={() => onToggle(entry, !isChecked)}
            layoutCardsStyle="grid"
            metadata={[{ path: 'title', target: 'header', width: 100 }]}
        />
    </li>
);


function DocumentsCatalog({
    id = 'documents-catalog',
    user,
    defaultQuery = {},
    order,
    menuItems = [],
    pageSize = 10,
    cardLayoutStyle = 'grid',
    monitoredState,
    style,
    requestResources = getDocuments,
    titleId = 'gnviewer.documentsCatalogTitle',
    queryPage,
    page: pageProp = 1,
    theme = 'main',
    metadata: metadataProp,
    noResultId = 'gnviewer.documentsCatalogNoResults',
    openInNewTab = false,
    resourcesFoundMsgId = 'Documents found',
    resourceTypes: availableResourceTypes = [],
    onClose,
    onAdd,
    onZoomTo,
}, context) {

    const prevSearchRef = React.useRef(null);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalResources, setTotalResources] = useState(0);
    const [error, setError] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [showFilter, setShowFilter] = useState(false);
    const [resourcesMetadata, setResourcesMetadata] = useState({});

    const handleSetLoading = (isLoading) => {
        setLoading(isLoading);
    }

    const handleSetResources = (newResources) => {
        setResources(newResources);
    };


    const handleSetResourcesMetadata = (metadata) => {
        setResourcesMetadata(metadata);
        if (metadata.total !== undefined) {
            setTotalResources(metadata.total);
        }
        if (metadata.error) {
            setError(true);
        }
    };


    const { search: handleUpdate, clear: handleClear, query } = useQueryDocumentsState({
        setLoading: handleSetLoading,
        setResources: handleSetResources,
        setResourcesMetadata: handleSetResourcesMetadata,
        request: requestResources,
        defaultQuery,
        pageSize,
        user,
        queryPage
    });


    const defaultTarget = openInNewTab ? '_blank' : undefined;
    const parsedConfig = useParsePluginConfigExpressions(monitoredState, {
        menuItems,
        order,
        metadata: metadataProp
    }, context?.plugins?.requires, {
        filterFunc: item => isMenuItemSupportedSupported(item, availableResourceTypes, user)
    });

    const menuItemsLeft = useMemo(() => {
        const hasActiveFilters = Object.keys(query).some(key =>
            !['page', 'sort', 'q', extension_field.filterKey].includes(key) &&
            query[key] !== undefined &&
            query[key] !== null &&
            query[key] !== ''
        );
        return [
            {
                Component: () => (
                    <FilterButton
                        onClick={() => setShowFilter(!showFilter)}
                        active={showFilter}
                        hasActiveFilters={hasActiveFilters}
                    />
                ),
                name: 'filter'
            }
        ]
    }, [showFilter]);

    const [metadataColumns, setMetadataColumns] = useState({});
    const columnsId = user?.name ? 'authenticated' : 'anonymous';
    const columns = metadataColumns?.[columnsId] || [];
    const metadata = Array.isArray(parsedConfig.metadata) ? parsedConfig.metadata : parsedConfig.metadata?.[cardLayoutStyle];

    const setColumns = (newColumns) => {
        setMetadataColumns((prev) => ({
            ...prev,
            [columnsId]: newColumns
        }));
    };

    const handleToggleDocument = (entry, checked) => {
        setSelectedDocuments(prev => {
            if (checked) {
                return [...prev, entry];
            }
            return prev.filter(doc => doc.pk !== entry.pk);
        });
    };

    const handleSelectResource = (selectedDocs) => {
        setLoading(true);
        documentsToLayerConfig(selectedDocs)
            .then((layer) => {
                onAdd(layer);
                const { minx, miny, maxx, maxy } = layer?.bbox?.bounds || {};
                const extent = layer?.bbox?.bounds && [minx, miny, maxx, maxy];
                if (extent) {
                    onZoomTo(extent, layer?.bbox?.crs);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const currentPagePks = new Set(resources.map(r => r.pk));
            setSelectedDocuments(prev => {
                const newSelection = prev.filter(doc => !currentPagePks.has(doc.pk));
                return [...newSelection, ...resources];
            });
        } else {
            const currentPagePks = new Set(resources.map(r => r.pk));
            setSelectedDocuments(prev => prev.filter(doc => !currentPagePks.has(doc.pk)));
        }
    };

    const isAllSelected = resources.length > 0 && resources.every(r =>
        selectedDocuments.some(doc => doc.pk === r.pk)
    );
    const isIndeterminate = selectedDocuments.length > 0 && !isAllSelected;


    const [localPage, setLocalPage] = useState(pageProp);
    const currentPage = query?.page || localPage;

    const handlePageChange = (value) => {
        setLocalPage(value);
        handleUpdate({ page: value });
    };

    const hasActiveSearch = useMemo(() => {
        return Object.keys(query).some(key =>
            !['page', 'sort'].includes(key) &&
            query[key] !== undefined &&
            query[key] !== null &&
            query[key] !== ''
        );
    }, [query]);

    const handleAddLayer = (isSearchMode) => {
        if (isSearchMode) {
            handleSelectResource(resources);
        } else {
            handleSelectResource(selectedDocuments);
        }
    };

    useEffect(() => {
        const currentSearchState = JSON.stringify(
            Object.keys(query)
                .filter(key => !['page', 'sort'].includes(key))
                .reduce((acc, key) => ({ ...acc, [key]: query[key] }), {})
        );

        if (prevSearchRef.current && prevSearchRef.current !== currentSearchState) {
            setSelectedDocuments([]);
        }
        prevSearchRef.current = currentSearchState;
    }, [query]);


    return (
        <FlexBox column className="gn-resources-catalog" style={style}>
            {onClose && (
                <FlexBox gap="sm" centerChildrenVertically classNames={['_padding-sm']}>
                    <FlexFill>
                        <Text><Message msgId={titleId} /></Text>
                    </FlexFill>
                    <Button square borderTransparent onClick={() => onClose()}>
                        <Glyphicon glyph="1-close" />
                    </Button>
                </FlexBox>
            )}

            <div className="gn-resources-catalog-filter">
                <InputControl
                    placeholder={'gnviewer.documentsCatalogFilterPlaceholder'}
                    value={query.q || ''}
                    debounceTime={300}
                    onChange={(value) => {
                        setLocalPage(1);
                        handleUpdate({ q: value || undefined, page: 1 });
                    }}
                />
                {(query.q && !loading) && (
                    <Button onClick={() => {
                        setLocalPage(1);
                        handleUpdate({ q: undefined, page: 1 });
                    }}>
                        <Glyphicon glyph="remove" />
                    </Button>
                )}
            </div>

            <FlexBox gap="sm" centerChildrenVertically classNames={['_padding-sm']}>
                <FlexBox.Fill>
                    <FormGroup controlId={extension_field.label} style={{ marginBottom: 0 }}>
                        <SelectSync
                            value={(() => {
                                const filterValue = query[extension_field.filterKey];
                                if (!filterValue) return [];
                                const values = Array.isArray(filterValue) ? filterValue : [filterValue];
                                return values.map((v) => ({ value: v, label: v }));
                            })()}
                            multi
                            placeholder={extension_field.placeholderId}
                            onChange={(selected) => {
                                const values = selected?.map(({ value }) => value) || [];
                                setLocalPage(1);
                                handleUpdate({
                                    [extension_field.filterKey]: values.length > 0 ? values : undefined
                                });
                            }}
                            options={extension_field.options}
                        />
                    </FormGroup>
                </FlexBox.Fill>
                <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ margin: 0 }}
                >
                    <Message msgId={'gnviewer.selectAll'} />
                </Checkbox>
            </FlexBox>

            <ResourcesMenu
                key={columnsId}
                theme={theme}
                titleId={""}
                menuItemsLeft={menuItemsLeft}
                menuItems={parsedConfig.menuItems || []}
                orderConfig={parsedConfig.order}
                totalResources={totalResources}
                loading={loading}
                cardLayoutStyle={cardLayoutStyle}
                hideCardLayoutButton
                style={{ padding: '0.6rem' }}
                query={query}
                metadata={metadata}
                columns={columns}
                setColumns={setColumns}
                target={defaultTarget}
                resourcesFoundMsgId={totalResources + " " + resourcesFoundMsgId}
                onSortChange={(sortValue) => {
                    handleUpdate({ sort: sortValue, page: currentPage })
                }}
            />

            <ResourcesPanelWrapper
                className="ms-resources-filter shadow-md"
                top={181}
                show={showFilter}
                enabled={showFilter}
            >
                <FiltersForm
                    id={'documents-catalog-filter-form'}
                    extentProps={parsedConfig.extent}
                    query={(() => {
                        const { [extension_field.filterKey]: _, ...filteredQuery } = query;
                        return filteredQuery;
                    })()}
                    onChange={(newParams) => {
                        setLocalPage(1);
                        handleUpdate({ ...newParams, page: 1 });
                    }}
                    onClear={handleClear}
                    onClose={() => setShowFilter(false)}
                />
            </ResourcesPanelWrapper>

            <div className="gn-resources-catalog-body">
                <ul className="gn-resources-catalog-list">
                    {resources.map((entry) => {
                        const isChecked = selectedDocuments.some(doc => doc.pk === entry.pk);
                        return (
                            <DocumentResourceItem
                                key={entry.pk}
                                entry={entry}
                                isChecked={isChecked}
                                onToggle={handleToggleDocument}
                            />
                        );
                    })}
                    {(resources.length === 0 && !loading) && (
                        <div className="gn-resources-catalog-alert">
                            <Message msgId={noResultId} />
                        </div>
                    )}
                </ul>
            </div>

            {loading && (
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Loader size={70} />
                </div>
            )}

            <FlexBox
                classNames={[`ms-${theme}-colors`, '_padding-tb-sm']}
                centerChildren
                style={{ position: 'sticky', bottom: 0 }}
            >
                {error ? (
                    <Button variant="primary" href="#/"><Glyphicon glyph="refresh" /></Button>
                ) : (
                    (!loading || !!totalResources) && (
                        <PaginationCustom
                            items={Math.ceil(totalResources / pageSize)}
                            activePage={localPage}
                            onSelect={handlePageChange}
                        />
                    )
                )}
            </FlexBox>

            <div className="gn-resources-catalog-add-layer">
                {selectedDocuments.length > 0 ? (
                    <Button
                        variant="primary"
                        onClick={() => handleAddLayer(false)}
                    >
                        <Message msgId={"Add Selected as a Layer"} />
                        {` (${selectedDocuments.length})`}
                    </Button>
                ) : hasActiveSearch ? (
                    <Button
                        variant="primary"
                        onClick={() => handleAddLayer(true)}
                        className="gn-add-layer-search"
                        disabled={totalResources === 0}
                    >
                        <Message msgId={"gnviewer.addSearchAsLayer"} />
                        {totalResources > 0 && ` (${totalResources})`}
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        disabled
                    >
                        <Message msgId={"gnviewer.addSearchAsLayer"} />
                    </Button>
                )}
            </div>

        </FlexBox>
    );
}

const ConnectedDocumentsCatalog = connect(
    createStructuredSelector({
        user: userSelector,
        monitoredState: getMonitoredStateSelector
    }), {}
)(DocumentsCatalog);

export default ConnectedDocumentsCatalog;