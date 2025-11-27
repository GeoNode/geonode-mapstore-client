/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect, Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Glyphicon, Checkbox } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';
import useInfiniteScroll from '@js/hooks/useInfiniteScroll';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import Loader from '@mapstore/framework/components/misc/Loader';
import ResourceCard from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourceCard';
import InputControl from '@mapstore/framework/plugins/ResourcesCatalog/components/InputControl';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
import ReactSelect from 'react-select';


const SelectSync = localizedProps('placeholder')(ReactSelect);


function DocumentsCompactCatalog({
    request,
    responseToEntries,
    pageSize,
    style,
    placeholderId,
    addSearchAsLayer,
    onSelect,
    onClose,
    titleId,
    noResultId,
    loading: resourceLoading,
    selectAll,
    params
}) {

    const scrollContainer = useRef();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [q, setQ] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [values, setValues] = useState({});
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


    // Not finalized yet - mock data for filters
    // Need to use facets from API response to build this 
    const fields = [
        {
            id: "type",
            labelId: "Type",
            type: "select",
            style: undefined,
            key: "filter{extension}",
            label: "Type",
            placeholderId: 'Select Type',
            options: [
                { value: 'jpg', label: 'jpg' },
                { value: 'png', label: 'png' },
            ]
        },
        {
            id: "category",
            labelId: "Category",
            filter: "filter{category.identifier.in}",
            type: "select",
            style: undefined,
            key: "filter{category.identifier.in}",
            label: "Category",
            description: 'Filter by category',
            options: [
                { value: 'boundaries', label: 'Boundaries' },
            ]
        },
        {
            id: "keyword",
            type: "select",
            style: undefined,
            filter: "filter{keywords.slug.in}",
            key: "filter{keywords.slug.in}",
            label: "Keyword",
            facet: 'keyword',
            labelId: "Keyword",
            placeholderId: 'Select Keyword',
            options: [
                { value: 'dsc-wx220', label: 'dsc-wx220' },
            ]
        }
    ];


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

    const isAllSelected = entries.length > 0 && selectedDocuments.length === entries.length;

    const updateRequest = useRef();
    updateRequest.current = (options) => {
        if (!loading && request) {
            if (scrollContainer.current && options.reset) {
                scrollContainer.current.scrollTop = 0;
            }

            setLoading(true);
            request({
                ...params,
                q,
                page: options.page,
                pageSize
            })
                .then((response) => {
                    if (isMounted.current) {
                        const newEntries = responseToEntries(response);
                        setIsNextPageAvailable(response.isNextPageAvailable);
                        setEntries(options.page === 1 ? newEntries : [...entries, ...newEntries]);
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
        if (page > 1) {
            updateRequest.current({ page });
        }
    }, [page]);

    useEffect(() => {
        setPage(1);
        setSelectedDocuments([]);
        updateRequest.current({ page: 1, reset: true });
    }, [q]);

    useEffect(() => {
        setPage(1);
        setSelectedDocuments([]);
        updateRequest.current({ page: 1, reset: true });
    }, [values]);

    function handleSelectResource(entries) {
        onSelect(entries);
    }

    const formgroup = fields.map((field, id) => {
        if (field.type === 'select') {
            const {
                id: formId,
                labelId,
                label,
                placeholderId,
                options: optionsField
            } = field;

            const key = `${id}-${formId}`;
            const filterKey = field.key;

            const currentValues = values[filterKey] || [];
            const options = (optionsField);
            const getFilterLabelById = (value) => options.find(option => option.value === value)?.label;

            // Need to change this after using facets 

            return (
                <FormGroup
                    key={key}
                    controlId={key}
                >
                    <label><strong>{labelId}</strong></label>
                    <SelectSync
                        value={currentValues.map((value) => ({ value, label: getFilterLabelById(value) || value }))}
                        multi
                        placeholder={placeholderId}
                        onChange={() => {
                            //  we need to use // updateRequest
                        }}
                        options={options}
                    />
                </FormGroup>
            );
        }
        return null;
    });

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
        <div className="gn-resources-catalog-filter">
            <InputControl
                placeholder={placeholderId}
                value={q}
                debounceTime={300}
                onChange={(value) => setQ(value)}
            />
            {(q && !loading) && <Button onClick={() => setQ('')}>
                <Glyphicon glyph="remove" />
            </Button>}
            {loading && <Spinner />}
        </div>

        <div className="gn-resources-catalog-filter-form" >
            {formgroup}
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

        <div className="gn-resources-catalog-select-all">
            <Checkbox
                checked={isAllSelected}
                onChange={(event) => handleSelectAll(event.target.checked)}
                disabled={entries.length === 0}
            >
                <Message msgId={selectAll} />
            </Checkbox>

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
    noResultId: PropTypes.string
};

DocumentsCompactCatalog.defaultProps = {
    responseToEntries: res => res.resources,
    pageSize: 10,
    placeholderId: 'gnviewer.resourcesCatalogFilterPlaceholder',
    titleId: 'gnviewer.resourcesCatalogTitle',
    noResultId: 'gnviewer.resourcesCatalogEntriesNoResults',
    addSearchAsLayer: 'gnviewer.addSearchAsLayer',
    selectAll: 'gnviewer.selectAll',
    onSelect: () => { }
};

export default DocumentsCompactCatalog;
