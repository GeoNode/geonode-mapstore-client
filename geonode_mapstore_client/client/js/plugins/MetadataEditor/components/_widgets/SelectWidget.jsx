/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import DefaultSelectWidget from '@rjsf/core/lib/components/widgets/SelectWidget';

function SelectWidget(props) {
    const { schema, options, multiple } = props;
    // the default widget shows an empty placeholder option when the schema has no default,
    // we hide it when the enum options already provide a null value
    // to avoid duplicated empty options
    const hasNullOption = !multiple
        && schema?.default === undefined
        && (options?.enumOptions || []).some(option => option.value === null);
    return (
        <DefaultSelectWidget
            {...props}
            schema={hasNullOption ? { ...schema, 'default': null } : schema}
        />
    );
}

export default SelectWidget;
