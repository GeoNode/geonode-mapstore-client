/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Glyphicon } from 'react-bootstrap';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';

const IconWithTooltip = tooltip((props) => <span {...props}><Glyphicon glyph="info-sign" /></span>);

export default IconWithTooltip;

