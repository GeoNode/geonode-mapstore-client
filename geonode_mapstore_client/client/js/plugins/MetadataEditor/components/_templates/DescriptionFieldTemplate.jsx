/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import isEmpty from "lodash/isEmpty";
import IconWithTooltip from '../IconWithTooltip';

const DescriptionFieldTemplate = (props) => {
    const { description, id } = props;
    if (isEmpty(description)) {
        return null;
    }
    return (
        <IconWithTooltip
            id={id}
            tooltip={description}
            tooltipPosition={"right"}
        />
    );
};

export default DescriptionFieldTemplate;
