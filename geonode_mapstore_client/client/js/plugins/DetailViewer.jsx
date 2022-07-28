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
    setMapThumbnail,
    setResourceThumbnail,
    enableMapThumbnailViewer,
    downloadResource,
    setFavoriteResources,
    removeFavoriteResource
} from '@js/actions/gnresource';
import { processingDownload } from '@js/selectors/resourceservice';
import FaIcon from '@js/components/FaIcon/FaIcon';
import controls from '@mapstore/framework/reducers/controls';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import gnresource from '@js/reducers/gnresource';
import {
    canEditResource,
    isNewResource,
    getResourceId,
    isThumbnailChanged,
    updatingThumbnailResource
} from '@js/selectors/resource';
import Button from '@js/components/Button';
import useDetectClickOut from '@js/hooks/useDetectClickOut';
import OverlayContainer from '@js/components/OverlayContainer';
import { withRouter } from 'react-router';
import { hashLocationToHref } from '@js/utils/SearchUtils';
import Message from '@mapstore/framework/components/I18N/Message';
import { layersSelector } from '@mapstore/framework/selectors/layers';
import { mapSelector } from '@mapstore/framework/selectors/map';
import { resourceHasPermission } from '@js/utils/ResourceUtils';

const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.data || null,
        state => state?.gnresource?.loading || false,
        state => state?.gnresource?.data?.favorite || false,
        state => state?.gnsave?.savingThumbnailMap || false,
        layersSelector,
        isThumbnailChanged,
        updatingThumbnailResource,
        mapSelector,
        state => state?.gnresource?.showMapThumbnail || false,
        processingDownload,
        state => state?.gnresource?.favoriteResources || []
    ], (resource, loading, favorite, savingThumbnailMap, layers, thumbnailChanged, resourceThumbnailUpdating, mapData, showMapThumbnail, downloading, favorites) => ({
        layers: layers,
        resource,
        loading,
        savingThumbnailMap,
        favorite: favorite || favorites.includes(resource?.pk),
        isThumbnailChanged: thumbnailChanged,
        resourceThumbnailUpdating,
        initialBbox: mapData?.bbox,
        enableMapViewer: showMapThumbnail,
        downloading,
        canDownload: resourceHasPermission(resource, 'download_resourcebase'),
        resourceId: resource.pk
    })),
    {
        closePanel: setControlProperty.bind(null, 'rightOverlay', 'enabled', false),
        onFavorite: setFavoriteResource,
        onMapThumbnail: setMapThumbnail,
        onResourceThumbnail: setResourceThumbnail,
        onClose: enableMapThumbnailViewer,
        onAction: downloadResource,
        setFavorites: setFavoriteResources,
        removeFavorite: removeFavoriteResource
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
        onEditThumbnail(val, true);
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
            className="gn-overlay-wrapper"
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
