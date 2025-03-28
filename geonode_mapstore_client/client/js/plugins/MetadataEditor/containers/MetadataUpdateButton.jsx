/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import get from 'lodash/get';
import PropTypes from "prop-types";
import { updateMetadata } from '@js/api/geonode/v2/metadata';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';
import { getMessageById } from '@mapstore/framework/utils/LocaleUtils';

function MetadataUpdateButton({
    pendingChanges,
    size,
    variant,
    pk,
    metadata,
    updating,
    setUpdating,
    setUpdateError,
    setInitialMetadata,
    setExtraErrors
}, context) {

    function handleUpdate() {
        setUpdating(true);
        setUpdateError(null);
        updateMetadata(pk, metadata)
            .then((response) => {
                setInitialMetadata(metadata);
                setExtraErrors(get(response, 'data.extraErrors', {}));
            })
            .catch((error) => {
                setExtraErrors(get(error, 'data.extraErrors', {}));
                let errorObj = { type: "danger", message: getMessageById(context.messages, 'gnviewer.metadataUpdateError') };
                if (error?.status === 422) {
                    // Partially successful. So reset pending metadata changes and allow user to fix error(s)
                    setInitialMetadata(metadata);
                    errorObj = { type: "warning", message: get(error, 'data.message', null) };
                }
                setUpdateError(errorObj);
            })
            .finally(() => {
                setUpdating(false);
            });
    }

    return (
        <Button
            size={size}
            variant={variant}
            disabled={!pendingChanges || updating}
            className={pendingChanges ? 'gn-pending-changes-icon' : ''}
            onClick={() => handleUpdate()}
        >
            <Message msgId="gnhome.update" />
        </Button>
    );
}

MetadataUpdateButton.contextTypes = {
    messages: PropTypes.object
};

export default MetadataUpdateButton;
