/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef } from 'react';
import axios from '@mapstore/framework/libs/ajax';
import castArray from 'lodash/castArray';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import Autocomplete from '../Autocomplete';
import DefaultSchemaField from '@rjsf/core/lib/components/fields/SchemaField';
import { get, template } from 'lodash';

function findProperty(name, properties) {
    return Object.keys(properties || {}).some((key) => {
        return key === name
            || (properties[key]?.properties ? findProperty(name, properties[key].properties) : false);
    });
}

function shouldHideLabel({
    name,
    ...props
}) {
    const parts = (name || '').split('-');
    const arrayId = parseFloat(parts[parts.length - 1]);
    if (!isNaN(arrayId)) {
        return !findProperty(name, props?.registry?.rootSchema?.properties);
    }
    return false;
}

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
        errorSchema,
        uiSchema,
        required,
        formContext
    } = props;
    const uiOptions = uiSchema?.['ui:options'];
    const autocomplete = uiOptions?.['geonode-ui:autocomplete'];
    const isSchemaItemString = schema?.items?.type === 'string';
    const isSchemaItemObject = schema?.items?.type === 'object';
    const isMultiSelect = schema?.type === 'array' && (isSchemaItemString ||
        (isSchemaItemObject && !isEmpty(schema?.items?.properties))
    );
    const isSingleSelect = schema?.type === 'object' && !isEmpty(schema?.properties);
    const referenceValuePath = uiOptions?.['geonode-ui:referencevalue'];
    const referenceKey = uiOptions?.['geonode-ui:referencekey'];

    // Extract index from the ID schema
    const match = idSchema.$id.match(/_(\d+)(_|$)/);
    const index = match ? parseInt(match[1], 10) : null;
    const referenceValue = referenceValuePath ? get(formContext, `metadata.${template(referenceValuePath)({'index': index})}`) : null;
    const prevReferenceValue = useRef(null);

    useEffect(()=> {
        // to reset the form data when the reference value changes
        // i.e when the parent field changes
        if (referenceValuePath && referenceValue !== prevReferenceValue.current?.[name]) {
            onChange(isMultiSelect ? [] : {});
        }
    }, [referenceValuePath, referenceValue]);

    if (autocomplete && (isMultiSelect || isSingleSelect)) {
        const {
            classNames,
            style,
            description,
            disabled,
            help: helpText,
            hideError,
            label,
            placeholder: autoCompletePlaceholder,
            title
        } = uiOptions;
        const errors = (!hideError ? castArray(errorSchema) : [])
            .reduce((acc, errorEntry) => {
                if (errorEntry?.__errors) {
                    acc.push({ messages: errorEntry.__errors });
                } else {
                    Object.keys(errorEntry || {}).forEach((key) => {
                        if (errorEntry[key]?.__errors) {
                            acc.push({ key, messages: errorEntry[key].__errors });
                        }
                    });
                }
                return acc;
            }, []);
        const autocompleteOptions = isString(autocomplete)
            ? { url: autocomplete }
            : autocomplete;
        let autocompleteUrl = autocompleteOptions?.url;
        if (referenceValue) {
            autocompleteUrl = template(autocompleteUrl)({[referenceKey ?? 'id']: referenceValue });
        }
        const queryKey = autocompleteOptions?.queryKey || 'q';
        const resultsKey = autocompleteOptions?.resultsKey || 'results';
        const valueKey = autocompleteOptions?.valueKey || 'id';
        const labelKey = autocompleteOptions?.labelKey || 'label';
        const creatable = !!autocompleteOptions?.creatable;
        const placeholder = autoCompletePlaceholder ?? ' ';

        let autoCompleteProps = {
            className: `field${classNames ? ' ' + classNames : ''}`,
            clearable: !required,
            creatable,
            id: idSchema.$id,
            labelKey,
            multi: isMultiSelect,
            name,
            placeholder,
            showLabel: label ?? true,
            title: title ?? schema.title,
            value: formData,
            valueKey,
            helpTitleIcon: true,
            description: helpText ?? description ?? schema.description, // Help text is preferred over description and displayed as a tooltip
            disabled: disabled || props?.readonly,
            style,
            required,
            onChange: (selected) => {
                const _selected = selected?.result ?? undefined;
                if (isMultiSelect) {
                    return onChange(selected.map(({ result, ...option }) => {
                        if (result === undefined) {
                            return option;
                        }
                        return isString(result)
                            ? result
                            : isSchemaItemString
                                ? result[valueKey]
                                : Object.fromEntries(
                                    Object.keys(schema.items?.properties)
                                        .map((key) => [key, result[key]])
                                );
                    }));
                }
                return onChange(_selected);
            },
            loadOptions: ({ q, config, ...params }) => {
                if (referenceValuePath) {
                // store the new reference value
                    prevReferenceValue.current = {...prevReferenceValue.current, [name]: referenceValue};
                }
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
                                        [valueKey]: isString(result) ? result : result[valueKey],
                                        [labelKey]: isString(result) ? result : result[labelKey]
                                    }
                                };
                            })
                        };
                    });
            },
            error: isEmpty(errors) ? null : <>
                {errors.map((entry, idx) => {
                    return (
                        <ul key={idx} className="text-danger">
                            {castArray(entry.messages).map((message, mIdx) => {
                                return <li key={mIdx}>{entry.key ? `${entry.key}: ` : ''}{message}</li>;
                            })}
                        </ul>
                    );
                })}
            </>
        };

        return <Autocomplete {...autoCompleteProps}/>;
    }

    const hideLabel = shouldHideLabel(props);
    return (
        <DefaultSchemaField
            {...props}
            uiSchema={hideLabel ? {
                ...props.uiSchema,
                'ui:label': false,
                'ui:options': {
                    ...props.uiSchema?.['ui:options'],
                    label: false
                }
            } : uiSchema}
        />
    );
};

export default SchemaField;
