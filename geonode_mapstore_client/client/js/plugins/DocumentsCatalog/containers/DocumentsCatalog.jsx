/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useMemo } from 'react';
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
import useQueryResourcesByParams from '../hooks/useQueryResourcesByParams';
import { isMenuItemSupportedSupported } from '@mapstore/framework/utils/ResourcesUtils';
import { getDocuments } from '@js/api/geonode/v2';
import useParsePluginConfigExpressions from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useParsePluginConfigExpressions';
import { userSelector } from '@mapstore/framework/selectors/security';
import { getMonitoredStateSelector } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import { documentsToLayerConfig } from '@js/plugins/DocumentsCatalog/utils';

const SelectSync = localizedProps('placeholder')(ReactSelect);

const checkboxStyle = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 10,
    borderRadius: '4px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const extensionField = {
    type: "select",
    facet: "extension",
    labelId: "Extension",
    label: "Extension",
    placeholderId: "gnviewer.filterByExtension",
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
        <div style={checkboxStyle} onClick={(e) => e.stopPropagation()}>
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
    // id = 'documents-catalog',
    user,
    order,
    menuItems = [],
    pageSize = 10,
    cardLayoutStyle = 'grid',
    monitoredState,
    style,
    requestResources = getDocuments,
    titleId = 'gnviewer.documentsCatalogTitle',
    theme = 'main',
    metadata: metadataProp,
    noResultId = 'gnviewer.noDocumentsFound',
    openInNewTab = false,
    resourcesFoundMsgId = 'gnviewer.documentsFound',
    resourceTypes: availableResourceTypes = [],
    onClose,
    onAdd,
    onZoomTo
}, context) {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalResources, setTotalResources] = useState(0);
    const [error, setError] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [showFilter, setShowFilter] = useState(false);

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [extensionFilter, setExtensionFilter] = useState([]);
    const [sort, setSort] = useState('');
    const [filters, setFilters] = useState({});

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleSearchChange = (value, clear) => {
        if (clear) {
            setSearch('');
        } else {
            setSearch(value);
        }
        setPage(1);
    };

    const handleExtensionFilterChange = (values) => {
        setExtensionFilter(values);
        setPage(1);
    };

    const handleSortChange = (sortValue) => {
        setSort(sortValue);
    };

    const handleFiltersChange = (newFilters, clear) => {
        if (clear) {
            setFilters({});
        } else {
            setFilters((prev) => ({
                ...prev,
                ...newFilters
            })
            );
        }
        setPage(1);
    };

    const handleSetResourcesMetadata = (metadata) => {
        if (metadata.total !== undefined) {
            setTotalResources(metadata.total);
        }
        if (metadata.error) {
            setError(true);
        }
    };

    useQueryResourcesByParams({
        request: requestResources,
        queryParams: {
            page,
            q: search,
            sort,
            'filter{extension.in}': extensionFilter.length > 0 ? extensionFilter : undefined,
            ...filters
        },
        pageSize,
        user,
        setLoading,
        setResources,
        setResourcesMetadata: handleSetResourcesMetadata
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
        const hasActiveFilters = Object.keys(filters).length > 0;
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
        ];
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

    const hasActiveSearch = useMemo(() => {
        return !!(search || Object.keys(filters).length > 0 || extensionFilter.length > 0);
    }, [search, filters, extensionFilter]);

    const handleAddLayer = (isSearchMode) => {
        if (isSearchMode) {
            handleSelectResource(resources);
        } else {
            handleSelectResource(selectedDocuments);
        }
    };

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
                    value={search}
                    debounceTime={300}
                    onChange={(value) => handleSearchChange(value, false)}
                />
                {(search && !loading) && (
                    <Button onClick={() => {
                        handleSearchChange('', true);
                    }}>
                        <Glyphicon glyph="remove" />
                    </Button>
                )}
            </div>

            <FlexBox gap="sm" centerChildrenVertically classNames={['_padding-sm']}>
                <FlexBox.Fill>
                    <FormGroup controlId={extensionField.label} style={{ marginBottom: 0 }}>
                        <SelectSync
                            value={(() => {
                                const values = Array.isArray(extensionFilter) ? extensionFilter : [extensionFilter];
                                return values.map((v) => ({ value: v, label: v }));
                            })()}
                            multi
                            placeholder={extensionField.placeholderId}
                            onChange={(selected) => {
                                const values = selected?.map(({ value }) => value) || [];
                                handleExtensionFilterChange(values);
                            }}
                            options={extensionField.options}
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
                query={
                    sort
                }
                metadata={metadata}
                columns={columns}
                setColumns={setColumns}
                target={defaultTarget}
                resourcesFoundMsgId={resourcesFoundMsgId}
                onSortChange={(sortValue) => {
                    handleSortChange(sortValue);
                }}
            />

            <div style={{
                marginLeft: 8
            }}>
                <ResourcesPanelWrapper
                    className="ms-resources-filter shadow-md"
                    top={182}
                    show={showFilter}
                    enabled={showFilter}
                >
                    <FiltersForm
                        id={'documents-catalog-filter-form'}
                        extentProps={parsedConfig.extent}
                        query={filters}
                        onChange={(newParams) => {
                            handleFiltersChange(newParams, false);
                        }}
                        onClear={() => {
                            handleFiltersChange({}, true);
                        }}
                        onClose={() => setShowFilter(false)}
                    />
                </ResourcesPanelWrapper>
            </div>
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
                            activePage={page}
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
                        <Message msgId={"gnviewer.addSelectedAsLayer"} />
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
