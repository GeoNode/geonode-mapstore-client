/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { connect } from 'react-redux';
import DetailsLocations from '../components/DetailsLocations';
import DetailsAssets from '../components/DetailsAssets';
import DetailsData from '../components/DetailsData';
import DetailsLinkedResources from '../components/DetailsLinkedResources';
import DetailsSettings from '../components/DetailsSettings';
import { setResourceExtent, updateResourceProperties } from '@js/actions/gnresource';

const tabComponents = {
    'locations': connect(() => ({}), { onSetExtent: setResourceExtent })(DetailsLocations),
    'linked-resources': DetailsLinkedResources,
    'assets': DetailsAssets,
    'data': connect(() => ({}), { onChange: updateResourceProperties })(DetailsData),
    'settings': connect(() => ({}), { onChange: updateResourceProperties })(DetailsSettings)
};

export default tabComponents;
