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
import { Form } from 'react-bootstrap-v1';
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
    setValues
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

                    const currentValues = suggestionsRequestKey
                        ? values[suggestionsRequestTypes[suggestionsRequestKey]?.filterKey] || []
                        : values[filterKey] || [];

                    const optionsProp = suggestionsRequestKey
                        ? { loadOptions: suggestionsRequestTypes[suggestionsRequestKey]?.loadOptions }
                        : { options: options.map(option => ({ value: option, label: option })) };
                    const Select = suggestionsRequestKey ? SelectAsync : SelectSync;
                    return (
                        <Form.Group
                            key={key}
                            controlId={key}
                        >
                            <Form.Label><strong>{labelId ? <Message msgId={labelId}/> : label}</strong></Form.Label>
                            <Select
                                value={currentValues.map((value) => ({ value, label: getFilterLabelById(filterKey, value) || value }))}
                                multi
                                placeholder={placeholderId}
                                onChange={(selected) => {
                                    setValues({
                                        ...values,
                                        [filterKey]: selected.map(({ value }) => value)
                                    });
                                }}
                                { ...optionsProp }
                            />
                            {description &&
                            <Form.Text className="text-muted">
                                {description}
                            </Form.Text>}
                        </Form.Group>
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
                            setValues={setValues}
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
                    const active = customFilters.find(value => value === field.id);
                    return (
                        <Form.Group controlId={'gn-radio-filter-' + field.id}>
                            <Form.Check
                                type="checkbox"
                                label={<Message msgId={field.labelId}/>}
                                checked={!!active}
                                value={field.id}
                                onChange={() => {
                                    setValues({
                                        ...values,
                                        f: active
                                            ? customFilters.filter(value => value !== field.id)
                                            : [...customFilters, field.id]
                                    });
                                }}/>
                        </Form.Group>
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
    setValues: PropTypes.func
};

FilterItems.defaultProps = {
    items: [],
    suggestionsRequestTypes: {},
    values: {},
    setValues: () => {}
};

export default FilterItems;
