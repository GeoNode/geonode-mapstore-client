/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useState } from 'react';
import { createPlugin } from '@mapstore/framework/utils/PluginsUtils';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import PropTypes from 'prop-types';
import { requestResource } from '@js/actions/gnresource';
import controls from '@mapstore/framework/reducers/controls';
import config from '@mapstore/framework/reducers/config';
import gnresource from '@js/reducers/gnresource';
import {
    getResourceData,
    getResourceLoading,
    getResourceDirtyState,
    canEditPermissions
} from '@js/selectors/resource';
import usePluginItems from '@mapstore/framework/hooks/usePluginItems';
import tabComponents from './containers/tabComponents';
import ResourcesPanelWrapper from '@mapstore/framework/plugins/ResourcesCatalog/components/ResourcesPanelWrapper';
import TargetSelectorPortal from '@mapstore/framework/plugins/ResourcesCatalog/components/TargetSelectorPortal';
import useResourcePanelWrapper from '@mapstore/framework/plugins/ResourcesCatalog/hooks/useResourcePanelWrapper';
import { getShowDetails } from '@mapstore/framework/plugins/ResourcesCatalog/selectors/resources';
import { setShowDetails } from '@mapstore/framework/plugins/ResourcesCatalog/actions/resources';
import PendingStatePrompt from '@mapstore/framework/plugins/ResourcesCatalog/containers/PendingStatePrompt';
import DetailsPanel from './containers/DetailsPanel';
import useDetectClickOut from '@js/hooks/useDetectClickOut';

/**
* @module ResourceDetails
*/

/**
 * render a panel for detail information about a resource inside the viewer pages
 * @name ResourceDetails
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
function ResourceDetailsPanel({
    tabs = [
        {
            "type": "tab",
            "id": "info",
            "labelId": "gnviewer.info",
            "items": [
                {
                    "type": "text",
                    "labelId": "gnviewer.title",
                    "value": "{context.get(state('gnResourceData'), 'title')}"
                },
                {
                    "type": "link",
                    "labelId": "gnviewer.owner",
                    "href": "{'/people/profile/' + context.get(state('gnResourceData'), 'owner.username')}",
                    "value": "{context.getUserResourceName(context.get(state('gnResourceData'), 'owner'))}",
                    "disableIf": "{!context.get(state('gnResourceData'), 'owner.username')}"
                },
                {
                    "type": "date",
                    "format": "YYYY-MM-DD HH:mm",
                    "labelId": "{'gnviewer.'+context.get(state('gnResourceData'), 'date_type')}",
                    "value": "{context.get(state('gnResourceData'), 'date')}"
                },
                {
                    "type": "date",
                    "format": "YYYY-MM-DD HH:mm",
                    "labelId": "gnviewer.created",
                    "value": "{context.get(state('gnResourceData'), 'created')}"
                },
                {
                    "type": "date",
                    "format": "YYYY-MM-DD HH:mm",
                    "labelId": "gnviewer.lastModified",
                    "value": "{context.get(state('gnResourceData'), 'last_updated')}"
                },
                {
                    "type": "query",
                    "labelId": "gnviewer.resourceType",
                    "value": "{context.get(state('gnResourceData'), 'resource_type')}",
                    "pathname": "/",
                    "query": {
                        "f": "{context.get(state('gnResourceData'), 'resource_type')}"
                    }
                },
                {
                    "type": "{context.isDocumentExternalSource(state('gnResourceData')) ? 'link' : 'text'}",
                    "labelId": "gnviewer.sourceType",
                    "value": "{context.get(state('gnResourceData'), 'sourcetype', '').toLowerCase()}",
                    "href": "{context.get(state('gnResourceData'), 'href')}"
                },
                {
                    "type": "query",
                    "labelId": "gnviewer.category",
                    "value": "{context.get(state('gnResourceData'), 'category.gn_description')}",
                    "pathname": "/",
                    "query": {
                        "filter{category.identifier.in}": "{context.get(state('gnResourceData'), 'category.identifier')}"
                    }
                },
                {
                    "type": "link",
                    "labelId": "gnviewer.pointOfContact",
                    "value": "{context.getUserResourceNames(context.get(state('gnResourceData'), 'poc'))}",
                    "disableIf": "{!context.get(state('gnResourceData'), 'poc')}"
                },
                {
                    "type": "query",
                    "labelId": "gnviewer.keywords",
                    "value": "{context.get(state('gnResourceData'), 'keywords')}",
                    "valueKey": "name",
                    "pathname": "/",
                    "queryTemplate": {
                        "filter{keywords.slug.in}": "${slug}"
                    }
                },
                {
                    "type": "query",
                    "labelId": "gnviewer.regions",
                    "value": "{context.get(state('gnResourceData'), 'regions')}",
                    "valueKey": "name",
                    "pathname": "/",
                    "queryTemplate": {
                        "filter{regions.code.in}": "${code}"
                    }
                },
                {
                    "type": "text",
                    "labelId": "gnviewer.attribution",
                    "value": "{context.get(state('gnResourceData'), 'attribution')}"
                },
                {
                    "type": "text",
                    "labelId": "gnviewer.language",
                    "value": "{context.get(state('gnResourceData'), 'language')}"
                },
                {
                    "type": "html",
                    "labelId": "gnviewer.supplementalInformation",
                    "value": "{context.get(state('gnResourceData'), 'supplemental_information')}"
                },
                {
                    "type": "date",
                    "format": "YYYY-MM-DD HH:mm",
                    "labelId": "gnviewer.temporalExtent",
                    "value": {
                        "start": "{context.get(state('gnResourceData'), 'temporal_extent_start')}",
                        "end": "{context.get(state('gnResourceData'), 'temporal_extent_end')}"
                    }
                },
                {
                    "type": "link",
                    "style": "label",
                    "labelId": "gnviewer.viewFullMetadata",
                    "href": "{context.getMetadataDetailUrl(state('gnResourceData'))}",
                    "disableIf": "{!context.getMetadataDetailUrl(state('gnResourceData'))}"
                }
            ]
        },
        {
            "type": "permissions",
            "id": "permissions",
            "labelId": "gnviewer.permissions",
            "disableIf": "{!context.canAccessPermissions(state('gnResourceData'))}",
            "items": [true]
        },
        {
            "type": "locations",
            "id": "locations",
            "labelId": "gnviewer.locations",
            "items": "{({extent: context.get(state('gnResourceData'), 'extent')})}"
        },
        {
            "type": "attribute-table",
            "id": "attributes",
            "labelId": "gnviewer.attributes",
            "disableIf": "{context.get(state('gnResourceData'), 'resource_type') !== 'dataset'}",
            "items": "{context.get(state('gnResourceData'), 'attribute_set')}"
        },
        {
            "type": "linked-resources",
            "id": "related",
            "labelId": "gnviewer.linkedResources.label",
            "items": "{context.get(state('gnResourceData'), 'linkedResources')}"
        },
        {
            "type": "assets",
            "id": "assets",
            "labelId": "gnviewer.assets",
            "items": "{context.get(state('gnResourceData'), 'assets')}"
        },
        {
            "type": "settings",
            "id": "settings",
            "labelId": "gnviewer.management",
            "disableIf": "{!context.canManageResourceSettings(state('gnResourceData'))}",
            "items": [
                true
            ]
        }
    ],
    items,
    editable = true,
    canEdit,
    targetSelector,
    headerNodeSelector = '#gn-brand-navbar',
    navbarNodeSelector = '#ms-action-navbar',
    footerNodeSelector = '.gn-footer',
    width,
    height,
    show,
    onShow,
    enableFilters,
    resource,
    resourcesGridId,
    loading,
    pendingChanges,
    enablePreview,
    editingOverlay,
    closeOnClickOut
}, context) {

    const [confirmModal, setConfirmModal] = useState(false);
    const editing = canEdit && editable;

    const {
        stickyTop,
        stickyBottom
    } = useResourcePanelWrapper({
        headerNodeSelector,
        navbarNodeSelector,
        footerNodeSelector,
        width,
        height,
        active: true
    });

    function handleConfirm() {
        onShow(false);
    }

    function handleClose() {
        if (pendingChanges) {
            setConfirmModal(true);
        } else {
            handleConfirm();
        }
    }

    useEffect(() => {
        return () => {
            // close when unmount
            handleClose();
        };
    }, []);

    const node = useDetectClickOut({
        disabled: !closeOnClickOut || !show,
        onClickOut: () => {
            handleClose();
        }
    });


    const { loadedPlugins } = context;
    const configuredItems = usePluginItems({ items, loadedPlugins }, [resource?.pk]);
    const toolbarItems = [
        ...configuredItems.filter(item => item.target === "toolbar")
    ].sort((a, b) => a.position - b.position);

    return (
        <TargetSelectorPortal targetSelector={targetSelector}>
            <ResourcesPanelWrapper
                className="ms-resource-detail shadow-md"
                top={stickyTop}
                bottom={stickyBottom}
                show={show}
                enabled={show}
                editing={editingOverlay && pendingChanges}
            >
                <DetailsPanel
                    panelRef={node}
                    resource={resource}
                    loading={loading}
                    toolbarItems={toolbarItems}
                    onClose={handleClose}
                    editing={editing}
                    enableFilters={enableFilters}
                    enablePreview={enablePreview}
                    tabs={tabs}
                    tabComponents={tabComponents}
                    resourcesGridId={resourcesGridId}
                />
            </ResourcesPanelWrapper>
            <PendingStatePrompt
                show={!!confirmModal}
                onCancel={() => setConfirmModal(false)}
                onConfirm={handleConfirm}
                pendingState={!!pendingChanges}
                titleId="resourcesCatalog.detailsPendingChangesTitle"
                descriptionId="resourcesCatalog.detailsPendingChangesDescription"
                cancelId="resourcesCatalog.detailsPendingChangesCancel"
                confirmId="resourcesCatalog.detailsPendingChangesConfirm"
                variant="danger"
            />
        </TargetSelectorPortal>
    );
}

ResourceDetailsPanel.contextTypes = {
    loadedPlugins: PropTypes.object,
    plugins: PropTypes.object
};

const ResourceDetails = ({ defaultOpen, ...props }) => {
    useEffect(() => {
        if (props?.resource?.pk && defaultOpen) {
            props.onShow(true);
        }
    }, [props?.resource?.pk, defaultOpen]);
    return props?.resource?.pk && props.show ? <ResourceDetailsPanel {...props}/> : null;
};

const ResourceDetailsPlugin = connect(
    createStructuredSelector({
        resource: getResourceData,
        show: getShowDetails,
        loading: getResourceLoading,
        canEdit: canEditPermissions,
        pendingChanges: getResourceDirtyState
    }),
    {
        onShow: setShowDetails
    }
)(ResourceDetails);

export default createPlugin('ResourceDetails', {
    component: ResourceDetailsPlugin,
    containers: {
        ActionNavbar: {
            name: 'ResourceDetailsButton',
            Component: connect(() => ({}), { onShow: setShowDetails })(({ component, resourcesGridId, onShow }) => {
                const Component = component;
                function handleClick() {
                    onShow(true, resourcesGridId);
                }
                return Component ? (
                    <Component
                        onClick={handleClick}
                        glyph="details"
                        iconType="glyphicon"
                        square
                        labelId="resourcesCatalog.viewResourceProperties"
                    />
                ) : null;
            }),
            priority: 1,
            doNotHide: true
        },
        ResourcesGrid: {
            priority: 2,
            target: 'card-buttons',
            position: 2,
            Component: connect(
                createStructuredSelector({
                    selectedResource: getResourceData
                }),
                {
                    onSelect: requestResource,
                    onShow: setShowDetails
                }
            )(({ resourcesGridId, resource, onSelect, component, selectedResource, onShow }) => {
                const Component = component;
                function handleClick() {
                    if (!selectedResource['@ms-detail'] || selectedResource?.pk !== resource?.pk) {
                        onSelect(resource, resourcesGridId);
                    }
                    onShow(true, resourcesGridId);
                }
                return (
                    <Component
                        onClick={handleClick}
                        glyph="details"
                        iconType="glyphicon"
                        square
                        labelId="resourcesCatalog.viewResourceProperties"
                    />
                );
            }),
            doNotHide: true
        }
    },
    reducers: {
        gnresource,
        controls,
        config
    }
});
