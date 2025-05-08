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
import DetailsAttributeTable from '../components/DetailsAttributeTable';
import DetailsLinkedResources from '../components/DetailsLinkedResources';
import DetailsPermissions from './Permissions';
import DetailsSettings from '../components/DetailsSettings';
import { setResourceExtent, updateResourceProperties } from '@js/actions/gnresource';

const tabComponents = {
    'attribute-table': DetailsAttributeTable,
    'linked-resources': DetailsLinkedResources,
    'permissions': DetailsPermissions,
    'locations': connect(() => ({}), { onSetExtent: setResourceExtent })(DetailsLocations),
    'assets': DetailsAssets,
    'settings': connect(() => ({}), { onChange: updateResourceProperties })(DetailsSettings)
};

export default tabComponents;
