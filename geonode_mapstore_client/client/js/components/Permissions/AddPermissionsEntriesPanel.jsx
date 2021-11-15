/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { FormControl as FormControlRB } from 'react-bootstrap';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import FaIcon from '@js/components/FaIcon/FaIcon';
import useInfiniteScroll from '@js/hooks/useInfiniteScroll';
import withDebounceOnCallback from '@mapstore/framework/components/misc/enhancers/withDebounceOnCallback';
import PermissionsRow from './PermissionsRow';
import Spinner from '@js/components/Spinner';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
const FormControl = localizedProps('placeholder')(FormControlRB);

function InputControl({ onChange, value, ...props }) {
    return <FormControl {...props} value={value} onChange={event => onChange(event.target.value)}/>;
}

const InputControlWithDebounce = withDebounceOnCallback('onChange', 'value')(InputControl);

function AddPermissionsEntriesPanel({
    request,
    responseToEntries,
    onAdd,
    onRemove,
    defaultPermission,
    pageSize,
    placeholderId
}) {

    const scrollContainer = useRef();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [q, setQ] = useState('');
    const isMounted = useRef();

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
            setLoading(true);
            request({
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
        updateRequest.current({ page: 1 });
    }, [q]);

    function updateEntries(newEntry) {
        setEntries(entries.map(entry => entry.id === newEntry.id ? newEntry : entry));
    }
    function handleAdd(entry) {
        const newEntry = {
            ...entry,
            permissions: defaultPermission
        };
        onAdd(newEntry);
        updateEntries(newEntry);
    }
    function handleRemove(entry) {
        const { permissions, ...newEntry } = entry;
        onRemove(newEntry);
        updateEntries(newEntry);
    }

    return (
        <div
            className="gn-add-permissions-entries-panel"
        >
            <div className="gn-share-filter">
                <InputControlWithDebounce
                    placeholder={placeholderId}
                    value={q}
                    debounceTime={300}
                    onChange={(value) => setQ(value)}
                />
                {(q && !loading) && <Button onClick={() => setQ('')}>
                    <FaIcon name="times"/>
                </Button>}
                {loading && <Spinner />}
            </div>
            <ul className="gn-share-permissions-list" ref={scrollContainer}>
                {entries.map((entry, idx) => {
                    return (
                        <li
                            key={entry.id + '-' + idx}
                        >
                            <PermissionsRow
                                {...entry}
                                superUser={entry.is_superuser}
                                hideOptions
                            >
                                {entry.permissions
                                    ? <Button
                                        onClick={() => handleRemove(entry)}
                                    >
                                        <FaIcon name="trash" />
                                    </Button>
                                    : <Button
                                        onClick={() => handleAdd(entry)}
                                    >
                                        <FaIcon name="plus" />
                                    </Button>
                                }
                            </PermissionsRow>
                        </li>
                    );
                })}
                {(entries.length === 0 && !loading) &&
                    <div className="gn-permissions-alert">
                        <Message msgId="gnviewer.permissionsEntriesNoResults" />
                    </div>
                }
            </ul>
        </div>
    );
}

AddPermissionsEntriesPanel.propTypes = {
    request: PropTypes.func,
    responseToEntries: PropTypes.func,
    onAdd: PropTypes.func,
    onRemove: PropTypes.func,
    defaultPermission: PropTypes.string,
    pageSize: PropTypes.number,
    placeholderId: PropTypes.string
};

AddPermissionsEntriesPanel.defaultProps = {
    defaultPermission: 'view',
    pageSize: 20,
    onAdd: () => {},
    onRemove: () => {},
    responseToEntries: res => res.resources,
    placeholderId: 'gnviewer.filterBy'
};

export default AddPermissionsEntriesPanel;
