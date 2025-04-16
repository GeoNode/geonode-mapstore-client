/*
 * Copyright 2023, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useState, useEffect } from "react";
import turfCenter from "@turf/center";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import get from "lodash/get";
import wk from 'wellknown';


import BaseMap from "@mapstore/framework/components/map/BaseMap";
import mapTypeHOC from "@mapstore/framework/components/map/enhancers/mapType";
import ZoomTo from "@js/components/ZoomTo/ZoomTo";
import { getPolygonFromExtent, bboxToFeatureGeometry } from "@mapstore/framework/utils/CoordinatesUtils";
import DrawSupport from "@js/components/DrawExtent";
import Message from "@mapstore/framework/components/I18N/Message";
import HTML from "@mapstore/framework/components/I18N/HTML";
import tooltip from "@mapstore/framework/components/misc/enhancers/tooltip";
import CopyToClipboardCmp from 'react-copy-to-clipboard';
import Button from "@mapstore/framework/components/misc/Button";
import FaIcon from "@js/components/FaIcon/FaIcon";

const Map = mapTypeHOC(BaseMap);
Map.displayName = "Map";
const CopyToClipboard = tooltip(CopyToClipboardCmp);

const BoundingBoxAndCenter = ({extent, center }) => {
    const [minx, miny, maxx, maxy] = extent || [];
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 1000);
        }
    }, [copied]);
    return (
        <div className={`gn-location-info`}>
            <div className="bounds">
                <div className="title">
                    <Message msgId={"gnviewer.boundingBox"}/>
                    <CopyToClipboard
                        text={!isEmpty(extent) && wk.stringify(bboxToFeatureGeometry(extent))}
                    >
                        <Button
                            variant="default"
                            onClick={()=> setCopied(true)}>
                            <FaIcon name="copy" />
                        </Button>
                    </CopyToClipboard>
                </div>
                <div className="bounds-row">
                    <Message msgId="gnviewer.minLat"/>
                    {miny?.toFixed(6)}
                </div>
                <div className="bounds-row">
                    <Message msgId="gnviewer.minLon"/>
                    {minx?.toFixed(6)}
                </div>
                <div className="bounds-row">
                    <Message msgId="gnviewer.maxLat"/>
                    {maxy?.toFixed(6)}
                </div>
                <div className="bounds-row">
                    <Message msgId="gnviewer.maxLon"/>
                    {maxx?.toFixed(6)}
                </div>
            </div>
            <div className="center">
                <div className="title">
                    <Message msgId={"gnviewer.center"}/>
                    <CopyToClipboard
                        text={!isEmpty(center) && wk.stringify(center)}
                    >
                        <Button
                            variant="default"
                            onClick={()=> setCopied(true)}>
                            <FaIcon name="copy" />
                        </Button>
                    </CopyToClipboard>
                </div>
                <div className="center-row">
                    <Message msgId="gnviewer.centerLat"/>
                    {get(center, 'geometry.coordinates.[1]')?.toFixed(6)}
                </div>
                <div className="center-row">
                    <Message msgId="gnviewer.centerLon"/>
                    {get(center, 'geometry.coordinates.[0]')?.toFixed(6)}
                </div>
            </div>
        </div>
    );
};

const getFeatureStyle = (type, isDrawn) => {
    if (type === "polygon") {
        return {
            color: isDrawn ? "#ffaa01" : "#397AAB",
            opacity: 0.8,
            fillColor: isDrawn
                ? "rgba(255, 170, 1, 0.1)"
                : "#397AAB",
            fillOpacity: 0.2,
            weight: 2
        };
    }
    return {
        iconAnchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        fillColor: isDrawn ? "#ffaa01" : "#397AAB",
        opacity: 0,
        size: 16,
        fillOpacity: 1,
        symbolUrl: '/static/mapstore/symbols/plus.svg'
    };
};

const defaultInteractions = {
    dragPan: true,
    mouseWheelZoom: true,
    pinchZoom: true
};

const DetailsLocations = ({ onSetExtent, fields, allowEdit: allowEditProp, resource } = {}) => {
    const extent = get(fields, 'extent.coords');
    const initialExtent = get(fields, 'initialExtent.coords');

    const polygon = !isEmpty(extent) ? getPolygonFromExtent(extent) : null;
    const center = !isEmpty(extent) && polygon ? turfCenter(polygon) : null;
    const isDrawn = initialExtent !== undefined && !isEqual(initialExtent, extent);

    const allowEdit = !!(onSetExtent && !['map', 'dataset'].includes(resource?.resource_type) && allowEditProp);

    return (
        <div className="gn-viewer-extent-map">
            <BoundingBoxAndCenter center={center} extent={extent} />
            <div className="map-wrapper">
                <Map
                    id="gn-locations-map"
                    key={`${resource?.resource_type}:${resource?.pk}`}
                    mapType={"openlayers"}
                    map={{
                        registerHooks: false,
                        projection: "EPSG:3857"
                    }}
                    options={{
                        interactive: allowEdit,
                        ...(!allowEdit && {
                            mapOptions: {
                                interactions: defaultInteractions
                            }
                        })
                    }}
                    styleMap={{
                        height: '100%'
                    }}
                    layers={[
                        {
                            type: 'osm',
                            title: 'Open Street Map',
                            name: 'mapnik',
                            source: 'osm',
                            group: 'background',
                            visibility: true
                        },
                        ...(!isEmpty(extent)
                            ? [
                                {
                                    id: "extent-location",
                                    type: "vector",
                                    features: [
                                        {
                                            ...polygon,
                                            style: getFeatureStyle("polygon", isDrawn)
                                        },
                                        {
                                            ...center,
                                            style: getFeatureStyle("point", isDrawn)
                                        }
                                    ]
                                }
                            ]
                            : [])
                    ]}
                >
                    <ZoomTo extent={extent?.join(",")} nearest={false} />
                    {allowEdit && <DrawSupport onSetExtent={onSetExtent}/>}
                </Map>
                {allowEdit && <HTML msgId="gnviewer.mapExtentHelpText"/>}
            </div>
        </div>
    );
};

export default DetailsLocations;
