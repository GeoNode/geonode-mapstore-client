/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';
import { FormControl as FormControlRB, Glyphicon } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import ResourceCard from '@js/components/ResourceCard';
import useInfiniteScroll from '@js/hooks/useInfiniteScroll';
import FaIcon from '@js/components/FaIcon/FaIcon';
import Spinner from '@js/components/Spinner';
import Loader from '@mapstore/framework/components/misc/Loader';
import withDebounceOnCallback from '@mapstore/framework/components/misc/enhancers/withDebounceOnCallback';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
const FormControl = localizedProps('placeholder')(FormControlRB);

function InputControl({ onChange, value, ...props }) {
    return <FormControl {...props} value={value} onChange={event => onChange(event.target.value)} />;
}

const InputControlWithDebounce = withDebounceOnCallback('onChange', 'value')(InputControl);

function ResourcesCompactCatalog({
    request,
    responseToEntries,
    pageSize,
    style,
    placeholderId,
    onSelect,
    onClose,
    titleId,
    noResultId,
    loading: resourceLoading,
    params
}) {

    const scrollContainer = useRef();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [q, setQ] = useState('');
    const isMounted = useRef();

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
        updateRequest.current({ page: 1, reset: true });
    }, [q]);

    function handleSelectResource(entry) {
        onSelect(entry);
    }

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
            <InputControlWithDebounce
                placeholder={placeholderId}
                value={q}
                debounceTime={300}
                onChange={(value) => setQ(value)}
            />
            {(q && !loading) && <Button onClick={() => setQ('')}>
                <FaIcon name="times" />
            </Button>}
            {loading && <Spinner />}
        </div>
        <div
            ref={scrollContainer}
            className="gn-resources-catalog-body"
        >
            <ul className="gn-resources-catalog-list" >
                {entries.map((entry) => {
                    return (
                        <li key={entry.pk}>
                            <ResourceCard
                                data={entry}
                                readOnly
                                layoutCardsStyle="list"
                                onClick={() => handleSelectResource(entry)}
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

ResourcesCompactCatalog.propTypes = {
    request: PropTypes.func,
    responseToEntries: PropTypes.func,
    pageSize: PropTypes.number,
    placeholderId: PropTypes.string,
    onClose: PropTypes.func,
    onSelect: PropTypes.func,
    titleId: PropTypes.string,
    noResultId: PropTypes.string
};

ResourcesCompactCatalog.defaultProps = {
    responseToEntries: res => res.resources,
    pageSize: 10,
    placeholderId: 'gnviewer.resourcesCatalogFilterPlaceholder',
    titleId: 'gnviewer.resourcesCatalogTitle',
    noResultId: 'gnviewer.resourcesCatalogEntriesNoResults',
    onSelect: () => { }
};

export default ResourcesCompactCatalog;
