/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Button from '@js/components/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import FaIcon from '@js/components/FaIcon';
import isEqual from 'lodash/isEqual';
import FilterByExtent from './FilterByExtent';
import FilterItems from './FilterItems';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import withDebounceOnCallback from '@mapstore/framework/components/misc/enhancers/withDebounceOnCallback';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
import { FormControl as FormControlRB } from 'react-bootstrap';
const FormControl = localizedProps('placeholder')(FormControlRB);
function InputControl({ onChange, value, ...props }) {
    return <FormControl {...props} value={value} onChange={event => onChange(event.target.value)}/>;
}
const InputControlWithDebounce = withDebounceOnCallback('onChange', 'value')(InputControl);

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
    timeDebounce
}) {

    const handleFieldChange = (newParam) => {
        onChange(newParam);
    };

    const extentChange = debounce((extent) => {
        onChange({ extent });
    }, timeDebounce);

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
                        <InputControlWithDebounce
                            placeholder="gnhome.search"
                            value={query.q || ''}
                            debounceTime={300}
                            onChange={(q) => handleFieldChange({ q })}
                        />
                        <FilterItems
                            id={id}
                            items={fields}
                            suggestionsRequestTypes={suggestionsRequestTypes}
                            values={query}
                            onChange={handleFieldChange}
                        />
                        <FilterByExtent
                            id={id}
                            extent={query.extent}
                            layers={extentProps?.layers}
                            vectorLayerStyle={extentProps?.style}
                            onChange={(({ extent }) =>{
                                extentChange(extent);
                            })}
                        />
                    </form>
                </div>
            </div>
            <div className="gn-filter-form-footer">
                <Button
                    size="sm"
                    variant="default"
                    onClick={onClear}
                    disabled={isEmpty(query)}
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
