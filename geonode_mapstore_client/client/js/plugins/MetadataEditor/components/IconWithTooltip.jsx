/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';

const IconWithTooltip = tooltip((props) => <span {...props}><Icon glyph="info-circle" /></span>);

export default IconWithTooltip;

