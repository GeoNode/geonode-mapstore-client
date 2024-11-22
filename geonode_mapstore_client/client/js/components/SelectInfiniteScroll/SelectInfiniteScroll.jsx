/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState, useEffect } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import ReactSelect from 'react-select';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';

const SelectSync = localizedProps('placeholder')(ReactSelect);

function SelectInfiniteScroll({
    loadOptions,
    pageSize = 20,
    debounceTime = 500,
    labelKey = "label",
    valueKey = "value",
    newOptionPromptText = "Create option",
    ...props
}) {

    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [options, setOptions] = useState([]);

    const source = useRef();
    const debounced = useRef();

    const createToken = () => {
        if (source.current) {
            source.current?.cancel();
            source.current = undefined;
        }
        const cancelToken = axios.CancelToken;
        source.current = cancelToken.source();
    };

    const updateNewOption = (newOptions, query) => {
        if (props.creatable && !isEmpty(query)) {
            const compareValue = (option) =>
                option?.[labelKey]?.toLowerCase() === query.toLowerCase();

            const isValueExist = props.value?.some(compareValue);
            const isOptionExist = newOptions.some(compareValue);

            // Add new option if it doesn't exist and `creatable` is enabled
            if (!isValueExist && !isOptionExist) {
                return [{
                    [labelKey]: `${newOptionPromptText} "${query}"`,
                    [valueKey]: query,
                    result: { [valueKey]: query, [labelKey]: query }
                }].concat(newOptions);
            }
            return newOptions;
        }
        return newOptions;
    };

    const handleUpdateOptions = useRef();
    handleUpdateOptions.current = (args = {}) => {
        createToken();
        const { q } = args;
        const query = q ?? text;
        setLoading(true);
        const newPage = args.page || page;
        loadOptions({
            q: query,
            page: newPage,
            pageSize,
            config: {
                cancelToken: source.current.token
            }
        })
            .then((response) => {
                let newOptions = response.results.map(({ selectOption }) => selectOption);
                newOptions = newPage === 1 ? newOptions : [...options, ...newOptions];
                newOptions = updateNewOption(newOptions, query);
                setOptions(newOptions);
                setIsNextPageAvailable(response.isNextPageAvailable);
                setLoading(false);
                source.current = undefined;
            })
            .catch(() => {
                setOptions([]);
                setIsNextPageAvailable(false);
                setLoading(false);
                source.current = undefined;
            });
    };

    function handleInputChange(value) {
        if (source.current) {
            source.current?.cancel();
            source.current = undefined;
        }

        debounced.current.cancel();
        debounced.current(value);
    }

    useEffect(() => {
        debounced.current = debounce((value) => {
            if (value !== text) {
                setText(value);
                setPage(1);
                setOptions([]);
                handleUpdateOptions.current({ q: value, page: 1 });
            }
        }, debounceTime);
    }, [text]);

    useEffect(() => {
        if (open) {
            setText('');
            setPage(1);
            setOptions([]);
            handleUpdateOptions.current({q: '', page: 1});
        }
    }, [open]);

    useEffect(() => {
        if (page > 1) {
            handleUpdateOptions.current();
        }
    }, [page]);

    const filterOptions = (currentOptions) => {
        return currentOptions.map(option=> {
            const match = /\"(.*?)\"/.exec(text);
            return match ? match[1] : option;
        });
    };

    return (
        <SelectSync
            {...props}
            isLoading={loading}
            options={options}
            labelKey={labelKey}
            valueKey={valueKey}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            filterOptions={filterOptions}
            onInputChange={(q) => handleInputChange(q)}
            onMenuScrollToBottom={() => {
                if (!loading && isNextPageAvailable) {
                    setPage(page + 1);
                }
            }}
        />
    );
}

export default SelectInfiniteScroll;
