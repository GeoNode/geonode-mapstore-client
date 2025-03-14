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
    const referenceValuePath = uiOptions?.['geonode-ui:referencevalue'];
    const referenceKey = uiOptions?.['geonode-ui:referencekey'];

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

    return { referenceValue, referenceKey };
};
