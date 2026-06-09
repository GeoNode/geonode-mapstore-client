/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {useEffect, useRef} from 'react';
import get from 'lodash/get';
import template from 'lodash/template';

export default ({
    uiSchema,
    idSchema,
    onChange,
    isMultiSelect,
    formContext,
    name
}) => {
    const uiOptions = uiSchema?.['ui:options'];
    const referenceValuePath = uiOptions?.['geonode-ui:referencevalue']; // example is: "dcatapit_themes.[${index}].theme.id"
    const referenceKey = uiOptions?.['geonode-ui:referencekey'];
    const referenceParent = referenceValuePath ? referenceValuePath.split('.').slice(0, -1).pop().split('-')[0] : null; // get the parent field name from the referenceValuePath

    // Extract index from the ID schema
    const match = idSchema.$id.match(/_(\d+)(_|$)/);
    const index = match ? parseInt(match[1], 10) : null;
    const referenceValue = referenceValuePath
        ? get(formContext, `metadata.${template(referenceValuePath)({'index': index})}`)
        : null;
    const prevReferenceValue = useRef(null);

    const storeReferenceValue = (value) => {
        prevReferenceValue.current = {
            ...prevReferenceValue.current, [name]: value
        };
    };

    useEffect(() => {
        // store the initial reference value
        if (prevReferenceValue.current === null && referenceValuePath) {
            storeReferenceValue(referenceValue);
        }
    }, []);

    useEffect(()=> {
        // to reset the form data when the parent field reference value changes
        if (referenceValuePath && referenceValue !== prevReferenceValue.current?.[name]) {
            storeReferenceValue(referenceValue);
            onChange(isMultiSelect ? [] : {});
        }
    }, [referenceValuePath, referenceValue]);

    return { referenceValue, referenceKey, referenceValuePath, referenceParent };
};
