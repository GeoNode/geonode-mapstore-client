/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import get from 'lodash/get';
import { updateMetadata } from '@js/api/geonode/v2/metadata';
import Message from '@mapstore/framework/components/I18N/Message';
import Button from '@js/components/Button';

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
}) {

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
                setUpdateError(get(error, 'data.message', null));
                if (error?.status === 422) {
                    // partially successful. Reinitialize metadata to allow user to correct errors
                    setInitialMetadata(metadata);
                }
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

export default MetadataUpdateButton;
