/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import axios from '@mapstore/framework/libs/ajax';
import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import Autocomplete from '@js/components/Autocomplete/Autocomplete';
import DefaultSchemaField from '@rjsf/core/lib/components/fields/SchemaField';

/**
 * `SchemaField` is an enhanced component that overrides `@rjsf`'s default `SchemaField`
 * - Customizes the rendering of object and array fields with custom functionality, such as support for autocomplete fields.
 * - Provides `onChange` handlers to update `formData` dynamically.
 * - Fallback to the default `SchemaField` from `@rjsf` when no custom rendering is needed.
 */
const SchemaField = (props) => {
    const {
        onChange,
        schema,
        formData,
        idSchema,
        name,
        uiSchema
    } = props;
    const autocomplete = uiSchema?.['ui:options']?.['geonode-ui:autocomplete'];
    const isMultiSelect =  schema?.items?.type === 'object' && !isEmpty(schema?.items?.properties);
    const isSingleSelect = schema?.type === 'object' && !isEmpty(schema?.properties);

    if (autocomplete && (isMultiSelect || isSingleSelect)) {
        const autocompleteOptions = isString(autocomplete)
            ? { url: autocomplete }
            : autocomplete;
        const autocompleteUrl = autocompleteOptions?.url;
        const queryKey = autocompleteOptions?.queryKey || 'q';
        const resultsKey = autocompleteOptions?.resultsKey || 'results';
        const valueKey = autocompleteOptions?.valueKey || 'id';
        const labelKey = autocompleteOptions?.labelKey || 'label';
        const placeholder = autocompleteOptions?.placeholder ?? '...';

        let autoCompleteProps = {
            id: idSchema.$id,
            name,
            title: schema.title,
            value: formData,
            valueKey,
            labelKey,
            placeholder,
            multi: isMultiSelect,
            clearable: !isMultiSelect,
            onChange: (selected) => {
                let _selected = selected?.result ?? null;
                if (isMultiSelect) {
                    _selected = selected.map(({ result, ...option }) => {
                        if (result === undefined) {
                            return option;
                        }
                        return Object.fromEntries(
                            Object.keys(schema.items.properties)
                                .map((key) => [key, result[key]])
                        );
                    });
                }
                onChange(_selected);
            }
        };

        return (
            <Autocomplete
                {...autoCompleteProps}
                className={"form-group gn-metadata-autocomplete"}
                onLoadOptions={({ q, config, ...params }) => {
                    return axios.get(autocompleteUrl, {
                        ...config,
                        params: {
                            ...params,
                            ...(q && { [queryKey]: q }),
                            page: params.page
                        }
                    })
                        .then(({ data }) => {
                            return {
                                isNextPageAvailable: !!data.pagination?.more,
                                results: data?.[resultsKey].map((result) => {
                                    return {
                                        selectOption: {
                                            result,
                                            value: result[valueKey],
                                            label: result[labelKey]
                                        }
                                    };
                                })
                            };
                        });
                }}
            />
        );
    }
    return <DefaultSchemaField {...props}/>;
};

export default SchemaField;
