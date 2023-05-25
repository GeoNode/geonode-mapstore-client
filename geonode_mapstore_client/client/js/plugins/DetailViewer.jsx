/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createPlugin, getMonitoredState } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
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
    downloadResource
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
import { parsePluginConfigExpressions } from '@js/utils/MenuUtils';
import detailViewerEpics from '@js/epics/detailviewer';

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
        processingDownload
    ], (resource, loading, favorite, savingThumbnailMap, layers, thumbnailChanged, resourceThumbnailUpdating, mapData, showMapThumbnail, downloading) => ({
        layers: layers,
        resource,
        loading,
        savingThumbnailMap,
        favorite: favorite,
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
        onAction: downloadResource
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

/**
* @module DetailViewer
*/

/**
 * render a panel for detail information about a resource inside the viewer pages
 * @name DetailViewer
 * @prop {array} tabs array of tab object representing the structure of the displayed info properties
 * @example
 * {
 *  "name": "DetailViewer",
 *  "cfg": {
 *      "tabs": [
 *          {
 *              "type": "tab",
 *              "id": "info",
 *              "labelId": "gnviewer.info",
 *              "items": [
 *                  {
 *                      "type": "text",
 *                      "labelId": "gnviewer.title",
 *                      "value": "{context.get(state('gnResourceData'), 'title')}"
 *                  },
 *                  {
 *                      "type": "link",
 *                      "labelId": "gnviewer.owner",
 *                      "href": "{'/people/profile/' + context.get(state('gnResourceData'), 'owner.username')}",
 *                      "value": "{context.getUserResourceName(context.get(state('gnResourceData'), 'owner'))}",
 *                      "disableIf": "{!context.get(state('gnResourceData'), 'owner.username')}"
 *                  },
 *                  {
 *                      "type": "date",
 *                      "format": "MMMM Do YYYY",
 *                      "labelId": "gnviewer.published",
 *                      "value": "{context.get(state('gnResourceData'), 'date')}"
 *                  },
 *                  {
 *                      "type": "query",
 *                      "labelId": "gnviewer.resourceType",
 *                      "value": "{context.get(state('gnResourceData'), 'resource_type')}",
 *                      "pathname": "/",
 *                      "query": {
 *                          "f": "{context.get(state('gnResourceData'), 'resource_type')}"
 *                      }
 *                  },
 *                  {
 *                      "type": "html",
 *                      "labelId": "gnviewer.supplementalInformation",
 *                      "value": "{context.get(state('gnResourceData'), 'supplemental_information')}"
 *                  }
 *              ]
 *          }
 *      ]
 *  }
 * }
 */
function DetailViewer({
    location,
    enabled,
    onEditResource,
    onEditAbstractResource,
    onEditThumbnail,
    canEdit,
    hide,
    user,
    onClose,
    monitoredState,
    queryPathname = '/',
    tabs = []
}) {

    const parsedConfig = parsePluginConfigExpressions(monitoredState, { tabs });

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
                tabs={parsedConfig.tabs}
                pathname={queryPathname}
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
            userSelector,
            state => getMonitoredState(state, getConfigProp('monitorState'))
        ],
        (enabled, canEdit, isNew, resourcePk, user, monitoredState) => ({
            enabled,
            canEdit,
            hide: isNew || !resourcePk,
            user,
            monitoredState
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
    epics: detailViewerEpics,
    reducers: {
        gnresource,
        controls
    }
});
