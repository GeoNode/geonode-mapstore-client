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
import usePluginItems from '@js/hooks/usePluginItems';
import {
    editTitleResource,
    editAbstractResource,
    editThumbnailResource,
    setFavoriteResource
} from '@js/actions/gnresource';
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

const ConnectedDetailsPanel = connect(
    createSelector(
        [
            (state) => state?.gnresource?.data || null,
            (state) => state?.gnresource?.loading || false,
            (state) => state?.gnresource?.data?.favorite || false
        ],
        (resource, loading, favorite) => ({
            resource,
            loading,
            favorite
        })
    ),
    {
        closePanel: setControlProperty.bind(
            null,
            'rightOverlay',
            'enabled',
            false
        ),
        onFavorite: setFavoriteResource
    }
)(DetailsPanel);

const ButtonViewer = ({ onClick, hide, variant, size }) => {
    const handleClickButton = () => {
        onClick();
    };

    return !hide ? (
        <Button
            variant={variant}
            size={size}
            onClick={handleClickButton}
        >
            <FaIcon name="info-circle" />
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
)(ButtonViewer);

function DetailViewer(
    {
        items,
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
    },
    context
) {
    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins });
    const buttonSaveThumbnailMap = configuredItems
        .filter(({ name }) => name === 'MapThumbnail')
        .map(({ Component, name }) => <Component key={name} />);

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
                buttonSaveThumbnailMap={buttonSaveThumbnailMap}
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
