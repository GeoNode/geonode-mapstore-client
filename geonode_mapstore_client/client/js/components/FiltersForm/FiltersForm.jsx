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
import { Form, Button } from 'react-bootstrap-v1';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/home/FaIcon';
import isEqual from 'lodash/isEqual';
import FilterByExtent from './FilterByExtent';
import FilterItems from './FilterItems';

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
    extentProps,
    suggestionsRequestTypes
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

    function handleClear() {
        const emptyValues = Object.keys(values).reduce((acc, filterKey) => {
            if (filterKey === 'extent' || filterKey === 'f') {
                return {
                    ...acc,
                    [filterKey]: undefined
                };
            }
            return {
                ...acc,
                [filterKey]: []
            };
        }, {});
        setValues(emptyValues);
        onChange(emptyValues);
    }

    return (
        <div className="gn-filter-form" style={styleContainerForm} >
            <div className="gn-filter-form-header">
                <div className="gn-filter-form-title"><Message msgId="gnhome.advancedSearch"/></div>
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
                    <Form
                        style={style}
                    >
                        <FilterItems
                            id={id}
                            items={fields}
                            suggestionsRequestTypes={suggestionsRequestTypes}
                            values={state.current.values}
                            setValues={setValues}
                        />
                        <FilterByExtent
                            id={id}
                            extent={values.extent}
                            queryExtent={query.extent}
                            layers={extentProps?.layers}
                            vectorLayerStyle={extentProps?.style}
                            onChange={({extent}) =>
                                setValues({
                                    ...values,
                                    extent
                                })
                            }
                        />
                    </Form>
                </div>
            </div>
            <div className="gn-filter-form-footer">
                <Button
                    size="sm"
                    variant="primary"
                    onClick={handleApply}
                >
                    <Message msgId="gnhome.apply"/>
                </Button>
                <Button
                    size="sm"
                    variant="default"
                    onClick={handleClear}
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
    extentProps: PropTypes.object,
    suggestionsRequestTypes: PropTypes.object
};

FilterForm.defaultProps = {
    query: {},
    fields: [],
    onChange: () => {},
    onClose: () => {},
    suggestionsRequestTypes: {}
};

const arePropsEqual = (prevProps, nextProps) => {
    return isEqual( prevProps.styleContainerForm, nextProps.styleContainerForm );
};


export default memo(FilterForm, arePropsEqual);
