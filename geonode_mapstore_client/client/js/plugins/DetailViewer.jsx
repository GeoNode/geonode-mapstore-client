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
    setFavoriteResource
} from '@js/actions/gnresource';
import controls from '@mapstore/framework/reducers/controls';
import { setControlProperty } from '@mapstore/framework/actions/controls';
import gnresource from '@js/reducers/gnresource';
import Message from '@mapstore/framework/components/I18N/Message';
import {
    canEditResource,
    isNewResource,
    getResourceId
} from '@js/selectors/resource';
import Button from '@js/components/Button';
import PropTypes from 'prop-types';
import useDetectClickOut from '@js/hooks/useDetectClickOut';
import OverlayContainer from '@js/components/OverlayContainer';

const ConnectedDetailsPanel = connect(
    createSelector([
        state => state?.gnresource?.data || null,
        state => state?.gnresource?.loading || false,
        state => state?.gnresource?.data?.favorite || false
    ], (resource, loading, favorite) => ({
        resource,
        loading,
        favorite
    })),
    {
        closePanel: setControlProperty.bind(null, 'rightOverlay', 'enabled', false),
        onFavorite: setFavoriteResource
    }
)(DetailsPanel);

const ButtonViewer = ({
    onClick,
    hide,
    variant,
    size
}) => {

    const handleClickButton = () => {
        onClick();
    };

    return !hide
        ? (<Button
            variant={variant}
            size={size}
            onClick={handleClickButton}
        > <Message msgId="gnviewer.details"/>
        </Button>)
        : null
    ;
};

const ConnectedButton = connect(
    createSelector([
        isNewResource,
        getResourceId
    ],
    (isNew, resourcePk) => ({
        hide: isNew || !resourcePk
    })),
    {
        onClick: setControlProperty.bind(null, 'rightOverlay', 'enabled', 'DetailViewer')
    }
)((ButtonViewer));


function DetailViewer({
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
    createSelector([
        state => state?.controls?.rightOverlay?.enabled === 'DetailViewer',
        canEditResource,
        isNewResource,
        getResourceId,
        userSelector
    ], (enabled, canEdit, isNew, resourcePk, user) => ({
        enabled,
        canEdit,
        hide: isNew || !resourcePk,
        user
    })),
    {
        onEditResource: editTitleResource,
        onEditAbstractResource: editAbstractResource,
        onEditThumbnail: editThumbnailResource,
        onClose: setControlProperty.bind(null, 'rightOverlay', 'enabled', false)
    }
)(DetailViewer);


export default createPlugin('DetailViewer', {
    component: DetailViewerPlugin,
    containers: {
        ViewerLayout: {
            name: 'DetailViewer',
            target: 'rightOverlay',
            priority: 1
        },
        ActionNavbar: {
            name: 'DetailViewerButton',
            Component: ConnectedButton,
            priority: 1
        }
    },
    epics: {},
    reducers: {
        gnresource,
        controls
    }
});
