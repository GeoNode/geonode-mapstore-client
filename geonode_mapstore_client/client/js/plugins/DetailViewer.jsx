/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import DetailsPanel from '@js/components/DetailsPanel';
import { userSelector } from '@mapstore/framework/selectors/security';
import {
    editTitleResource,
    editAbstractResource,
    editThumbnailResource,
    setFavoriteResource,
    setMapThumbnail
} from '@js/actions/gnresource';
import FaIcon from '@js/components/FaIcon/FaIcon';
import controls from '@mapstore/framework/reducers/controls';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import gnresource from '@js/reducers/gnresource';
import {
    canEditResource,
    isNewResource,
    getResourceId
} from '@js/selectors/resource';
import Button from '@js/components/Button';
import PropTypes from 'prop-types';
import useDetectClickOut from '@js/hooks/useDetectClickOut';
import OverlayContainer from '@js/components/OverlayContainer';
import { withRouter } from 'react-router';
import { hashLocationToHref } from '@js/utils/SearchUtils';
import FaIcon from '@js/components/FaIcon/FaIcon';
import Message from '@mapstore/framework/components/I18N/Message';
import { layersSelector } from '@mapstore/framework/selectors/layers';

const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.data || null,
        state => state?.gnresource?.loading || false,
        state => state?.gnresource?.data?.favorite || false,
        state => state?.gnsave?.savingThumbnailMap || false,
        layersSelector
    ], (resource, loading, favorite, savingThumbnailMap, layers) => ({
        layers: layers,
        resource,
        loading,
        savingThumbnailMap,
        favorite
    })),
    {
        closePanel: setControlProperty.bind(null, 'rightOverlay', 'enabled', false),
        onFavorite: setFavoriteResource,
        onMapThumbnail: setMapThumbnail
    }
)(DetailsPanel);

const ButtonViewer = ({ onClick, hide, variant, size, showMessage }) => {
    const handleClickButton = () => {
        onClick();
    };

    return !hide ? (
        <Button
            variant={variant}
            size={size}
            onClick={handleClickButton}
        >
            {!showMessage ? <FaIcon name="info-circle" /> : <Message msgId="gnviewer.editInfo"/>}
        </Button>
    ) : null;
};

const ConnectedButton = connect(
    createSelector([isNewResource, getResourceId], (isNew, resourcePk) => ({
        hide: isNew || !resourcePk
    })),
    {
        onClick: setControlProperty.bind(
            null,
            'rightOverlay',
            'enabled',
            'DetailViewer'
        )
    }
)((ButtonViewer));


function DetailViewer({
    location,
    enabled,
    onEditResource,
    onEditAbstractResource,
    onEditThumbnail,
    canEdit,
    width,
    hide,
    user,
    onClose
}) {


    const handleTitleValue = (val) => {
        onEditResource(val);
    };

    const handleAbstractValue = (val) => {
        onEditAbstractResource(val);
    };
    const handleEditThumbnail = (val) => {
        onEditThumbnail(val);
    };

    const node = useDetectClickOut({
        disabled: !enabled,
        onClickOut: () => {
            onClose();
        }
    });

    const handleFormatHref = (options) => {
        return hashLocationToHref({
            location,
            ...options
        });
    };

    if (hide) {
        return null;
    }

    return (
        <OverlayContainer
            enabled={enabled}
            ref={node}
            style={{
                width
            }}
        >
            <ConnectedDetailsPanel
                editTitle={handleTitleValue}
                editAbstract={handleAbstractValue}
                editThumbnail={handleEditThumbnail}
                activeEditMode={enabled && canEdit}
                enableFavorite={!!user}
                formatHref={handleFormatHref}
            />
        </OverlayContainer>
    );
}

DetailViewer.propTypes = {
    width: PropTypes.number
};

DetailViewer.defaultProps = {
    width: 800
};

const DetailViewerPlugin = connect(
    createSelector(
        [
            (state) =>
                state?.controls?.rightOverlay?.enabled === 'DetailViewer',
            canEditResource,
            isNewResource,
            getResourceId,
            userSelector
        ],
        (enabled, canEdit, isNew, resourcePk, user) => ({
            enabled,
            canEdit,
            hide: isNew || !resourcePk,
            user
        })
    ),
    {
        onEditResource: editTitleResource,
        onEditAbstractResource: editAbstractResource,
        onEditThumbnail: editThumbnailResource,
        onClose: setControlProperty.bind(null, 'rightOverlay', 'enabled', false)
    }
)(withRouter(DetailViewer));

export default createPlugin('DetailViewer', {
    component: DetailViewerPlugin,
    containers: {
        ActionNavbar: {
            name: 'DetailViewerButton',
            Component: ConnectedButton
        }
    },
    epics: {},
    reducers: {
        gnresource,
        controls
    }
});
