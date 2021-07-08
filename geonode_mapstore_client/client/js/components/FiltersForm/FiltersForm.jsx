/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import castArray from 'lodash/castArray';
import Button from '@js/components/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/home/FaIcon';
import isEqual from 'lodash/isEqual';
import FilterByExtent from './FilterByExtent';
import FilterItems from './FilterItems';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
/**
 * FilterForm component allows to configure a list of field that can be used to apply filter on the page
 * @name FilterForm
 * @memberof components
 * @prop {string} id the thumbnail is scaled based on the following configuration
 */
function FilterForm({
    id,
    style,
    styleContainerForm,
    query,
    fields,
    onChange,
    onClose,
    onClear,
    extentProps,
    suggestionsRequestTypes,
    submitOnChangeField,
    timeDebounce,
    formParams
}) {

    const [values, setValues] = useState({});
    const state = useRef({});
    state.current = {
        query,
        fields,
        values
    };


    useEffect(() => {
        const newValues = state.current.fields.reduce((acc, { id: formId, suggestionsRequestKey }) => {
            const filterKey = suggestionsRequestKey
                ? suggestionsRequestTypes[suggestionsRequestKey]?.filterKey
                : `filter{${formId}.in}`;
            if (filterKey && !state.current.query[filterKey]) {
                return acc;
            }
            return {
                ...acc,
                [filterKey]: (filterKey) ? castArray(state.current.query[filterKey]) : []
            };
        }, {});

        setValues({
            ...newValues,
            ...(query?.extent && { extent: query.extent }),
            ...(query?.f && { f: query.f })
        });

    }, [query]);


    function handleApply() {
        onChange(values);
    }

    useEffect( () => {
        submitOnChangeField
        && isEmpty(query)
        && setValues(formParams);
    },
    [formParams]);

    const fieldChange = (val) => {
        onChange(val);
    };

    return (
        <div className="gn-filter-form" style={styleContainerForm} >
            <div className="gn-filter-form-header">
                <div className="gn-filter-form-title">
                    <FaIcon name="filter"/> <strong><Message msgId="gnhome.filters"/></strong>
                </div>
                <Button
                    variant="default"
                    onClick={() => onClose()}
                    size="sm"
                >
                    <FaIcon name="times"/>
                </Button>
            </div>
            <div
                className="gn-filter-form-body"
            >
                <div className="gn-filter-form-content">
                    <form
                        style={style}
                    >
                        <FilterItems
                            id={id}
                            items={fields}
                            suggestionsRequestTypes={suggestionsRequestTypes}
                            values={state.current.values}
                            setValues={fieldChange}
                        />
                        <FilterByExtent
                            id={id}
                            extent={values.extent}
                            queryExtent={query.extent}
                            layers={extentProps?.layers}
                            vectorLayerStyle={extentProps?.style}
                            onChange={debounce(({extent}) =>
                                setValues({
                                    ...values,
                                    extent
                                }), timeDebounce)
                            }
                        />
                    </form>
                </div>
            </div>
            <div className="gn-filter-form-footer">
                {(!submitOnChangeField) && <Button
                    size="sm"
                    variant="primary"
                    onClick={handleApply}
                >
                    <Message msgId="gnhome.apply"/>
                </Button>
                }
                <Button
                    size="sm"
                    variant="default"
                    onClick={onClear}
                >
                    <Message msgId="gnhome.clearFilters"/>
                </Button>
            </div>
        </div>
    );
}

FilterForm.defaultProps = {
    id: PropTypes.string,
    style: PropTypes.object,
    styleContainerForm: PropTypes.object,
    query: PropTypes.object,
    fields: PropTypes.array,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    onClear: PropTypes.func,
    extentProps: PropTypes.object,
    suggestionsRequestTypes: PropTypes.object,
    submitOnChangeField: PropTypes.bool,
    timeDebounce: PropTypes.number,
    formParams: PropTypes.object

};

FilterForm.defaultProps = {
    query: {},
    fields: [],
    onChange: () => {},
    onClose: () => {},
    onClear: () => {},
    suggestionsRequestTypes: {},
    submitOnChangeField: true,
    timeDebounce: 500,
    formParams: {}
};

const arePropsEqual = (prevProps, nextProps) => {
    return isEqual( prevProps.query, nextProps.query );
};


export default memo(FilterForm, arePropsEqual);
