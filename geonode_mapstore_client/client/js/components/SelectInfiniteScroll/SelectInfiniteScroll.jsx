/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import debounce from 'lodash/debounce';
import ReactSelect from 'react-select';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';

const SelectSync = localizedProps('placeholder')(ReactSelect);

function SelectInfiniteScroll({
    loadOptions,
    pageSize = 20,
    debounceTime,
    ...props
}) {

    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [options, setOptions] = useState([]);

    const handleUpdateOptions = useRef();
    handleUpdateOptions.current = (args = {}) => {
        if (!loading) {
            setLoading(true);
            const newPage = args.page || page;
            loadOptions({
                q: args.q || text,
                page: newPage,
                pageSize
            })
                .then((response) => {
                    const newOptions = response.results.map(({ selectOption }) => selectOption);
                    setOptions(newPage === 1 ? newOptions : [...options, ...newOptions]);
                    setIsNextPageAvailable(response.isNextPageAvailable);
                    setLoading(false);
                })
                .catch(() => {
                    setOptions([]);
                    setIsNextPageAvailable(false);
                    setLoading(false);
                });
        }
    };

    function handleInputChange(q) {
        if (q !== text) {
            setText(q);
            setPage(1);
            setOptions([]);
            handleUpdateOptions.current({ q, page: 1 });
        }
    }

    const initOpen = useRef();
    useEffect(() => {
        if (!initOpen.current && open) {
            handleUpdateOptions.current();
            initOpen.current = true;
        }
    }, [open]);

    useEffect(() => {
        if (page > 1) {
            handleUpdateOptions.current();
        }
    }, [page]);

    return (
        <SelectSync
            {...props}
            isLoading={loading}
            options={options}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            filterOptions={(currentOptions) => {
                return currentOptions;
            }}
            onInputChange={debounce(q => handleInputChange(q), debounceTime)}
            onMenuScrollToBottom={() => {
                if (!loading && isNextPageAvailable) {
                    setPage(page + 1);
                }
            }}
        />
    );
}

export default SelectInfiniteScroll;
