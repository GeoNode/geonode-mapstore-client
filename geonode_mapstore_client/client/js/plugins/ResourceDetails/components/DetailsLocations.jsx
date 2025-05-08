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
import ZoomTo from '@mapstore/framework/plugins/ResourcesCatalog/components/ZoomTo';
import { getPolygonFromExtent, bboxToFeatureGeometry } from "@mapstore/framework/utils/CoordinatesUtils";
import DrawSupport from "../components/DrawExtent";
import Message from "@mapstore/framework/components/I18N/Message";
import HTML from "@mapstore/framework/components/I18N/HTML";
import tooltip from "@mapstore/framework/components/misc/enhancers/tooltip";
import CopyToClipboardCmp from 'react-copy-to-clipboard';
import Button from "@mapstore/framework/components/layout/Button";
import FlexBox from "@mapstore/framework/components/layout/FlexBox";
import Text from "@mapstore/framework/components/layout/Text";
import Icon from "@mapstore/framework/plugins/ResourcesCatalog/components/Icon";

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
        <FlexBox column gap="md" style={{ width: 250 }}>
            <FlexBox column gap="xs" classNames={['_padding-b-md']}>
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']} centerChildrenVertically>
                    <Text fontSize="sm">
                        <Message msgId={"gnviewer.boundingBox"}/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        <CopyToClipboard
                            text={!isEmpty(extent) && wk.stringify(bboxToFeatureGeometry(extent))}
                        >
                            <Button
                                variant="default"
                                onClick={()=> setCopied(true)}>
                                <Icon glyph="copy" />
                            </Button>
                        </CopyToClipboard>
                    </Text>
                </FlexBox>
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']}>
                    <Text fontSize="sm">
                        <Message msgId="gnviewer.minLat"/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        {miny?.toFixed(6)}
                    </Text>
                </FlexBox>
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']}>
                    <Text fontSize="sm">
                        <Message msgId="gnviewer.minLon"/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        {minx?.toFixed(6)}
                    </Text>
                </FlexBox>
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']}>
                    <Text fontSize="sm">
                        <Message msgId="gnviewer.maxLat"/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        {maxy?.toFixed(6)}
                    </Text>
                </FlexBox>
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']}>
                    <Text fontSize="sm">
                        <Message msgId="gnviewer.maxLon"/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        {maxx?.toFixed(6)}
                    </Text>
                </FlexBox>
            </FlexBox>
            <FlexBox column gap="xs">
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']} centerChildrenVertically>
                    <Text fontSize="sm">
                        <Message msgId={"gnviewer.center"}/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        <CopyToClipboard
                            text={!isEmpty(center) && wk.stringify(center)}
                        >
                            <Button
                                variant="default"
                                onClick={()=> setCopied(true)}>
                                <Icon glyph="copy" />
                            </Button>
                        </CopyToClipboard>
                    </Text>
                </FlexBox>
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']}>
                    <Text fontSize="sm">
                        <Message msgId="gnviewer.centerLat"/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        {get(center, 'geometry.coordinates.[1]')?.toFixed(6)}
                    </Text>
                </FlexBox>
                <FlexBox gap="xs" classNames={['_row', '_padding-b-xs']}>
                    <Text fontSize="sm">
                        <Message msgId="gnviewer.centerLon"/>
                    </Text>
                    <Text component={FlexBox.Fill} fontSize="sm" textAlign="right">
                        {get(center, 'geometry.coordinates.[0]')?.toFixed(6)}
                    </Text>
                </FlexBox>
            </FlexBox>
        </FlexBox>
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

const DetailsLocations = ({ onSetExtent, fields, editing: allowEditProp, resource } = {}) => {

    const extent = get(fields, 'extent.coords');
    const initialExtent = get(fields, 'initialExtent.coords');

    const polygon = !isEmpty(extent) ? getPolygonFromExtent(extent) : null;
    const center = !isEmpty(extent) && polygon ? turfCenter(polygon) : null;
    const isDrawn = initialExtent !== undefined && !isEqual(initialExtent, extent);

    const allowEdit = onSetExtent && !['map', 'dataset'].includes(resource?.resource_type) && allowEditProp;

    return (
        <div>
            <FlexBox gap="md" classNames={['_padding-tb-md']}>
                <BoundingBoxAndCenter center={center} extent={extent} />
                <FlexBox.Fill classNames={['_relative', 'ms-secondary-colors']}>
                    <Map
                        id="gn-locations-map"
                        key={`${resource?.resource_type}:${resource?.pk}`}
                        mapType={"openlayers"}
                        map={{
                            registerHooks: false,
                            projection: "EPSG:3857"
                        }}
                        options={{interactive: !!allowEdit}}
                        styleMap={{
                            position: 'absolute',
                            width: '100%',
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
                </FlexBox.Fill>
            </FlexBox>
            {allowEdit && <Text fontSize="sm"><HTML msgId="gnviewer.mapExtentHelpText"/></Text>}
        </div>
    );
};

export default DetailsLocations;
