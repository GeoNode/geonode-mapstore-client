/* eslint-disable no-return-assign */
/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState} from 'react';
import PropTypes from 'prop-types';
import castArray from 'lodash/castArray';
import { FormGroup, Checkbox } from 'react-bootstrap';
import ReactSelect from 'react-select';
import Message from '@mapstore/framework/components/I18N/Message';
import localizedProps from '@mapstore/framework/components/misc/enhancers/localizedProps';
import { getFilterLabelById } from '@js/utils/GNSearchUtils';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';

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
                                    setValues({
                                        ...values,
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
                    const customStoreType = (values.storeType || []);
                    const active = customFilters.find(value => value === field.id);
                    const [childFilters, setChildFilters] = useState(field.items || []);
                    const unChecked = false;
                    const checked = true;
                    const resetCheckboxChild = (flag) => {
                        childFilters.map(item => {
                            if (customStoreType.includes(item.id)) {
                                item.isChecked =  flag;
                            }
                        });
                    };
                    const handleParentFilter = () => {

                        (!!active) ? resetCheckboxChild(unChecked)
                            : setChildFilters(field.items);

                    };
                    resetCheckboxChild(checked);

                    const handleChildFilter = (event) => {
                        childFilters.map(item => {
                            if (item.id === event.target.value) {
                                item.isChecked =  event.target.checked;
                            }
                        });
                        setChildFilters(childFilters);
                        const itemChoosed = childFilters.filter(value => value.isChecked === checked)
                            .map(item => item.id);

                        setValues({
                            ...values,
                            storeType: itemChoosed
                        });

                    };

                    const filterChild = () => {

                        return childFilters.map((item) => {
                            return (<Checkbox
                                type="checkbox"
                                checked={item.isChecked}
                                value={item.id}
                                onChange={handleChildFilter}
                            >
                                <Message msgId={item.labelId}/>
                            </Checkbox>);
                        } );
                    };

                    return (
                        <FormGroup controlId={'gn-radio-filter-' + field.id}>
                            <Checkbox
                                type="checkbox"
                                checked={!!active}
                                value={field.id}
                                onClick={field.items && handleParentFilter}
                                onChange={() => {
                                    setValues({
                                        ...values,
                                        f: active
                                            ? customFilters.filter(value => value !== field.id)
                                            : [...customFilters, field.id],
                                        storeType: active ? undefined :  customStoreType

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
    setValues: PropTypes.func
};

FilterItems.defaultProps = {
    items: [],
    suggestionsRequestTypes: {},
    values: {},
    setValues: () => {}
};

export default FilterItems;
