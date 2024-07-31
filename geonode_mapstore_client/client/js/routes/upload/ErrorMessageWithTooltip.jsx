
/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import FaIcon from '@js/components/FaIcon';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';

function ErrorMessage(props) {
    return (<div {...props} className="gn-failed-upload"><FaIcon name="exclamation" /></div> );
}

const ErrorMessageWithTooltip = tooltip(ErrorMessage);

export default ErrorMessageWithTooltip;
