/*
 * Copyright 2025, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import { createPlugin } from "@mapstore/framework/utils/PluginsUtils";

import Dropdown from '@js/components/Dropdown';
import FaIcon from '@js/components/FaIcon/FaIcon';
import { getSelectedLayerDataset } from '@js/selectors/resource';
import { SOURCE_TYPES } from "@js/utils/ResourceUtils";

const DatasetDownload = connect(
    createSelector([
        getSelectedLayerDataset
    ], (resource) => ({
        resource
    }))
)(({
    items,
    selectedNodes,
    status,
    statusTypes,
    resource, // the selected layer's dataset resource
    allowedSources = [SOURCE_TYPES.LOCAL] // allowed sources for download
}) => {
    const toolbarItems = items?.filter(item => item.target === "toolbar");
    const layer = selectedNodes?.[0]?.node;
    if ([statusTypes?.LAYER].includes(status) && layer && !layer?.error && toolbarItems.length > 0) {
        return (
            <div className="gn-layer-download">
                <Dropdown className={"download-dropdown"}>
                    <Dropdown.Toggle
                        id={ `gn-toggle-dropdown-layer-download`}
                        bsStyle={"primary"}
                        noCaret
                    >
                        <FaIcon name={"download"} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        {toolbarItems.map(({Component, name}, idx) => (
                            <Dropdown.Item eventKey={idx}>
                                <Component
                                    key={`${name}-item-${idx}`}
                                    resource={resource}
                                    allowedSources={allowedSources}
                                    variant="default"
                                />
                            </Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        );
    }
    return null;
});

/**
 * Plugin for downloading the dataset resource
 * via direct download or export the data associated
 * @name DatasetDownload
 * @example
 * {
 *  "name": "DatasetDownload"
 * }
 */
export default createPlugin('DatasetDownload', {
    component: DatasetDownload,
    containers: {
        TOC: {
            doNotHide: true,
            name: "DatasetDownload",
            target: 'toolbar',
            Component: DatasetDownload,
            position: 11
        }
    },
    epics: {},
    reducers: {}
});
