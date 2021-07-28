/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import castArray from 'lodash/castArray';
import { FormGroup, Checkbox } from 'react-bootstrap';
import ReactSelect from 'react-select';
import Message from '@mapstore/framework/components/I18N/Message';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
import { getFilterLabelById } from '@js/utils/GNSearchUtils';
const SelectSync = localizedProps('placeholder')(ReactSelect);
const SelectAsync = localizedProps('placeholder')(ReactSelect.Async);

function FilterItems({
    id,
    items,
    suggestionsRequestTypes,
    values,
    onChange
}) {
    return (
        <>
            {items.map((field) => {
                if (field.type === 'select') {
                    const {
                        id: formId,
                        labelId,
                        label,
                        placeholderId,
                        description,
                        options,
                        suggestionsRequestKey
                    } = field;
                    const key = `${id}-${formId || suggestionsRequestKey}`;
                    const filterKey = suggestionsRequestKey
                        ? suggestionsRequestTypes[suggestionsRequestKey]?.filterKey
                        : `filter{${formId}.in}`;

                    const currentValues = castArray(suggestionsRequestKey
                        ? values[suggestionsRequestTypes[suggestionsRequestKey]?.filterKey] || []
                        : values[filterKey] || []);

                    const optionsProp = suggestionsRequestKey
                        ? { loadOptions: suggestionsRequestTypes[suggestionsRequestKey]?.loadOptions }
                        : { options: options.map(option => ({ value: option, label: option })) };
                    const Select = suggestionsRequestKey ? SelectAsync : SelectSync;
                    return (
                        <FormGroup
                            key={key}
                            controlId={key}
                        >
                            <label><strong>{labelId ? <Message msgId={labelId}/> : label}</strong></label>
                            <Select
                                value={currentValues.map((value) => ({ value, label: getFilterLabelById(filterKey, value) || value }))}
                                multi
                                placeholder={placeholderId}
                                onChange={(selected) => {
                                    onChange({
                                        [filterKey]: selected.map(({ value }) => value)
                                    });
                                }}
                                { ...optionsProp }
                            />
                            {description &&
                            <div className="text-muted">
                                {description}
                            </div>}
                        </FormGroup>
                    );
                }
                if (field.type === 'group') {
                    return (<>
                        <div className="gn-filter-form-group-title">
                            <strong><Message msgId={field.labelId}/> </strong>
                        </div>
                        <FilterItems
                            id={id}
                            items={field.items}
                            suggestionsRequestTypes={suggestionsRequestTypes}
                            values={values}
                            onChange={onChange}
                        />
                    </>);
                }
                if (field.type === 'divider') {
                    return <div className="gn-filter-form-divider"></div>;
                }
                if (field.type === 'link') {
                    return <div className="gn-filter-form-link"><a href={field.href}>{field.labelId && <Message msgId={field.labelId} /> || field.label}</a></div>;
                }
                if (field.type === 'filter') {
                    const customFilters = castArray(values.f || []);
                    const filterChild = () => {
                        return field.items && field.items.map((item) => {
                            const active = customFilters.find(value => value === item.id);
                            return (
                                <Checkbox
                                    type="checkbox"
                                    checked={!!active}
                                    value={item.id}
                                    onChange={() => {
                                        onChange({
                                            f: active
                                                ? customFilters.filter(value => value !== item.id)
                                                : [...customFilters, item.id]
                                        });
                                    }}
                                >
                                    <Message msgId={item.labelId}/>
                                </Checkbox>
                            );
                        } );
                    };
                    const active = customFilters.find(value => value === field.id);
                    const parentFilterIds = [
                        field.id,
                        ...(field.items
                            ? field.items.map((item) => item.id)
                            : [])
                    ];
                    return (
                        <FormGroup controlId={'gn-radio-filter-' + field.id}>
                            <Checkbox
                                type="checkbox"
                                checked={!!active}
                                value={field.id}
                                onChange={() => {
                                    onChange({
                                        f: active
                                            ? customFilters.filter(value => !parentFilterIds.includes(value))
                                            : [...customFilters, field.id]
                                    });
                                }}>
                                <Message msgId={field.labelId}/>
                                {!!active && filterChild()}
                            </Checkbox>
                        </FormGroup>
                    );
                }
                return null;
            })}
        </>
    );
}

FilterItems.defaultProps = {
    id: PropTypes.string,
    items: PropTypes.array,
    suggestionsRequestTypes: PropTypes.object,
    values: PropTypes.object,
    onChange: PropTypes.func
};

FilterItems.defaultProps = {
    items: [],
    suggestionsRequestTypes: {},
    values: {},
    onChange: () => {}
};

export default FilterItems;
