/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

const TitleFieldTemplate = (props) => {
    const { id, required, title, description } = props;
    return (
        <div id={id}>
            <label>{title}</label>
            {required && <span className="required">{' '}*</span>}
            {description ? <>{' '}{description}</> : null}
        </div>
    );
};

export default TitleFieldTemplate;
