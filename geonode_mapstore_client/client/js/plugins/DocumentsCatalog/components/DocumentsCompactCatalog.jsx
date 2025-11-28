/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Glyphicon, Checkbox } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import Loader from '@mapstore/framework/components/misc/Loader';
import ResourceCard from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourceCard';
import FiltersForm from '../containers/DocumentsFiltersForm';
import useInfiniteScroll from '@js/hooks/useInfiniteScroll';
function DocumentsCompactCatalog({
    request,
    responseToEntries,
    style,
    addSearchAsLayer,
    onSelect,
    onClose,
    titleId,
    noResultId,
    loading: resourceLoading,
    selectAll,
    fields
}) {

    const scrollContainer = useRef();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [params, setParams] = useState({
        page_size: 20,
        page: 1
    });
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const isMounted = useRef();

    const handleToggleDocument = (entry, checked) => {
        setSelectedDocuments(prev => {
            if (checked) {
                return [...prev, entry];
            }
            return prev.filter(doc => doc.pk !== entry.pk);
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedDocuments([...entries]);
        } else {
            setSelectedDocuments([]);
        }
    };

    const loadingActive = loading
        ? loading
        : !!resourceLoading;

    useInfiniteScroll({
        scrollContainer: scrollContainer.current,
        shouldScroll: () => !loading && isNextPageAvailable,
        onLoad: () => {
            setPage(page + 1);
        }
    });

    const updateRequest = useRef();
    updateRequest.current = (options) => {
        if (!loading && request) {
            if (scrollContainer.current && options.reset) {
                scrollContainer.current.scrollTop = 0;
            }

            setLoading(true);
            request(options)
                .then((response) => {
                    if (isMounted.current) {
                        const newEntries = responseToEntries(response);
                        setIsNextPageAvailable(response.isNextPageAvailable);
                        setEntries(options.page === 1
                            ? newEntries
                            : [...entries, ...newEntries.filter(e => !entries.some(en => en.pk === e.pk))]
                        );
                        setLoading(false);
                    }
                })
                .catch(() => {
                    if (isMounted.current) {
                        setLoading(false);
                    }
                });
        }
    };
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);


    useEffect(() => {
        setPage(1);
        setSelectedDocuments([]);
        updateRequest.current({ ...params, page: 1, reset: true });
    }, [JSON.stringify(params)]);

    useEffect(() => {
        if (page > 1) {
            updateRequest.current({ ...params, page });
        }
    }, [page]);


    function handleSelectResource(selectedEntries) {
        onSelect(selectedEntries);
    }

    const onSearch = (newParams = {}) => {
        const { clear, ...rest } = newParams;
        if (clear) {
            setSelectedDocuments([]);
            setParams({
                page_size: 20,
                page: 1
            });
            return;
        }
        setParams(prev => ({
            ...prev,
            ...rest,
            page: 1
        }));
    };

    return (<div
        className="gn-resources-catalog"
        style={style}
    >
        {onClose && <div className="gn-resources-catalog-head">
            <div className="gn-resources-catalog-title"><Message msgId={titleId} /></div>
            <Button className="square-button" onClick={() => onClose()}>
                <Glyphicon glyph="1-close" />
            </Button>
        </div>}
        <div className="gn-resources-catalog-filter-form" >
            <FiltersForm
                id={'documents-catalog-filter-form'}
                fields={fields}
                query={params}
                onChange={(newParams) => onSearch(newParams)}
                onClear={() => onSearch({ clear: true })}
                selectAll={selectAll}
                handleSelectAll={handleSelectAll}
                entries={entries}
                selectedDocuments={selectedDocuments}
            />
        </div>
        <div className="gn-resources-catalog-add-layer">
            <Button
                variant="primary"
                disabled={selectedDocuments.length === 0}
                onClick={() => handleSelectResource(selectedDocuments)}
            >
                <Message msgId={addSearchAsLayer} />
                {selectedDocuments.length > 0 && ` (${selectedDocuments.length})`}
            </Button>
        </div>

        <div
            ref={scrollContainer}
            className="gn-resources-catalog-body"
        >
            <ul className="gn-resources-catalog-list" >
                {entries.map((entry) => {
                    const isChecked = selectedDocuments.some(doc => doc.pk === entry.pk);
                    return (
                        <li key={entry.pk} style={{ position: 'relative' }}>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    zIndex: 10,
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    checked={isChecked}
                                    onChange={(event) => {
                                        event.stopPropagation();
                                        handleToggleDocument(entry, event.target.checked);
                                    }}
                                    style={{
                                        margin: 0,
                                        padding: 0
                                    }}
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
                                layoutCardsStyle="grid"
                                metadata={[{ path: 'title', target: 'header', width: 100 }]}
                            />
                        </li>
                    );
                })}
                {(entries.length === 0 && !loading) &&
                    <div className="gn-resources-catalog-alert">
                        <Message msgId={noResultId} />
                    </div>
                }
            </ul>

        </div>
        {loadingActive && <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Loader size={70} />
        </div>}

    </div>);
}

DocumentsCompactCatalog.propTypes = {
    request: PropTypes.func,
    responseToEntries: PropTypes.func,
    pageSize: PropTypes.number,
    placeholderId: PropTypes.string,
    addSearchAsLayer: PropTypes.string,
    selectAll: PropTypes.string,
    onClose: PropTypes.func,
    onSelect: PropTypes.func,
    titleId: PropTypes.string,
    noResultId: PropTypes.string,
    fields: PropTypes.array,
    loading: PropTypes.bool,
    style: PropTypes.object
};

DocumentsCompactCatalog.defaultProps = {
    responseToEntries: res => res.resources,
    pageSize: 10,
    placeholderId: 'gnviewer.resourcesCatalogFilterPlaceholder',
    titleId: 'gnviewer.resourcesCatalogTitle',
    noResultId: 'gnviewer.resourcesCatalogEntriesNoResults',
    addSearchAsLayer: 'gnviewer.addSearchAsLayer',
    selectAll: 'gnviewer.selectAll',
    onSelect: () => { },
    fields: [
        { type: "search" },
        { type: "select", facet: "category" },
        { type: "select", facet: "keyword" },
        { type: "select", facet: "extension" }
    ]
};

export default DocumentsCompactCatalog;
