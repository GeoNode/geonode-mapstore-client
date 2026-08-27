/*
 * Copyright 2026, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { connect } from 'react-redux';

import CatalogPlugin from '@mapstore/framework/plugins/Catalog';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@mapstore/framework/components/layout/Button';

const AddLayerActionButton = ({
    onClick,
    size,
    variant
}) => {

    const handleClickButton = () => {
        onClick();
    };

    return (
        <Button
            size={size}
            onClick={handleClickButton}
            variant={variant}
        >
            <Message msgId="gnviewer.addLayerButton" />
        </Button>
    );
};

const ConnectedAddLayerActionButton = connect(null, {
    onClick: setControlProperty.bind(null, 'metadataexplorer', 'enabled', true, true)
})(AddLayerActionButton);

const { CatalogPlugin: Catalog, ...pluginParts } = CatalogPlugin;

// extend the MapStore Catalog plugin with the GeoNode ActionNavbar item
export default {
    ...pluginParts,
    CatalogPlugin: Object.assign(Catalog, {
        ActionNavbar: {
            name: 'AddLayerButton',
            Component: ConnectedAddLayerActionButton,
            priority: 1,
            doNotHide: true
        }
    })
};
