/*
 * Copyright 2024, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useRef, useState } from 'react';
import Thumbnail from '@mapstore/framework/components/misc/Thumbnail';
import Icon from '@mapstore/framework/plugins/ResourcesCatalog/components/Icon';
import Button from '@mapstore/framework/components/layout/Button';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import FlexBox from '@mapstore/framework/components/layout/FlexBox';
import Text from '@mapstore/framework/components/layout/Text';
import { boundsToExtentString } from '@mapstore/framework/plugins/ResourcesCatalog/utils/ResourcesCoordinatesUtils';
import { Message } from '@mapstore/framework/components/I18N/I18N';
import ZoomTo from '@mapstore/framework/plugins/ResourcesCatalog/components/ZoomTo';
import Spinner from '@mapstore/framework/components/layout/Spinner';
import BaseMap from '@mapstore/framework/components/map/BaseMap';
import mapTypeHOC from '@mapstore/framework/components/map/enhancers/mapType';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';
import { ResourceTypes, GXP_PTYPES, isDefaultDatasetSubtype, resourceToLayers } from '@js/utils/ResourceUtils';

const Map = mapTypeHOC(BaseMap);
Map.displayName = 'Map';

const ButtonWithToolTip = tooltip(Button);

const MapThumbnailView = ({
    initialBbox,
    layers,
    onMapThumbnail,
    onClose,
    savingThumbnailMap
} ) => {
    const [currentBbox, setCurrentBbox] = useState();
    const { bounds, crs } = initialBbox || {};
    const extent = bounds ? boundsToExtentString(bounds, crs) : '-180,-90,180,90';
    function handleOnMapViewChanges(center, zoom, bbox) {
        setCurrentBbox(bbox);
    }
    return (
        <>
            <Map
                id="gn-map-thumbnail-view"
                mapType="openlayers"
                map={{
                    registerHooks: false,
                    projection: 'EPSG:3857' // to use parameter projection
                }}
                styleMap={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%'
                }}
                eventHandlers={{
                    onMapViewChanges: handleOnMapViewChanges
                }}
                layers={[
                    ...(layers ? layers : [])
                ]}
            >
                <ZoomTo extent={extent} />
            </Map>
            <FlexBox className="_absolute _margin-sm _corner-tl">
                <ButtonWithToolTip
                    variant="primary"
                    disabled={savingThumbnailMap}
                    onClick={() => onMapThumbnail(currentBbox)}
                    className="ms-notification-circle warning"
                >
                    <Message msgId="gnhome.apply" />
                </ButtonWithToolTip>
                <ButtonWithToolTip
                    variant="primary"
                    size="xs"
                    square
                    disabled={savingThumbnailMap}
                    onClick={() => onClose(false)}
                >
                    {savingThumbnailMap ? <Spinner /> : <Icon glyph="1-close" type="glyphicon" />}
                </ButtonWithToolTip>
            </FlexBox>
        </>
    );
};

function DetailsThumbnail({
    icon,
    editing,
    thumbnail,
    onChange,
    enableMapViewer,
    onEnableMapThumbnailViewer,
    initialBbox,
    onMapThumbnail,
    savingThumbnailMap,
    isThumbnailChanged,
    onResourceThumbnail,
    resourceThumbnailUpdating,
    resource = {}
}) {

    const { defaultThumbnailSize } = getConfigProp('geoNodeSettings');
    const { height = 500, width = 200 } = defaultThumbnailSize;
    const defaultMap = window.overrideNewMapConfig({ map: { layers: [] } });

    const thumbnailRef = useRef(null);
    const handleUpload = () => {
        const input = thumbnailRef?.current?.querySelector('input');
        if (input) {
            input.click();
        }
    };

    const canCreateMapThumbnail = resource.resource_type === ResourceTypes.MAP
        ? true
        : resource.resource_type === ResourceTypes.DATASET
            && ![GXP_PTYPES.REST_IMG, GXP_PTYPES.REST_MAP].includes(resource.ptype)
            && isDefaultDatasetSubtype(resource.subtype)
            ? true
            : false;

    const getInitialBbox = () => {
        if (initialBbox) {
            return initialBbox;
        }
        if (resource?.extent) {
            const [minx, miny, maxx, maxy] = resource.extent.coords;
            return { bounds: { minx, miny, maxx, maxy }, crs: resource.extent.srid };
        }
        return null;
    };

    return (
        <FlexBox
            ref={thumbnailRef}
            classNames={[
                'ms-details-thumbnail',
                'ms-resource-card-img',
                'ms-image-colors',
                '_relative'
            ]}
            centerChildren
        >
            {icon && !thumbnail ? <Text fontSize="xxl"><Icon {...icon} /></Text> : null}
            {editing
                ? enableMapViewer
                    ? <MapThumbnailView
                        initialBbox={getInitialBbox()}
                        layers={[
                            ...(defaultMap?.map?.layers || []),
                            ...resourceToLayers(resource)
                        ]}
                        onClose={() => onEnableMapThumbnailViewer(false)}
                        onMapThumbnail={onMapThumbnail}
                        savingThumbnailMap={savingThumbnailMap}
                    />
                    : <>
                        <Thumbnail
                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                            thumbnail={thumbnail}
                            onUpdate={(data) => {
                                onChange(data);
                            }}
                            thumbnailOptions={{
                                contain: false,
                                width,
                                height,
                                type: 'image/jpg',
                                quality: 0.5
                            }}
                        />
                        <FlexBox className="_absolute _margin-sm _corner-tl">
                            <ButtonWithToolTip
                                variant="primary"
                                square
                                onClick={() => handleUpload()}
                                tooltipId="resourcesCatalog.uploadImage"
                                tooltipPosition={"top"}
                                disabled={resourceThumbnailUpdating}
                            >
                                <Icon glyph="upload" type="glyphicon"/>
                            </ButtonWithToolTip>
                            {isThumbnailChanged
                                ? (
                                    <ButtonWithToolTip
                                        variant="primary"
                                        onClick={() => onResourceThumbnail()}
                                        disabled={resourceThumbnailUpdating}
                                        className="ms-notification-circle warning"
                                    >
                                        <Message msgId="gnhome.apply" />
                                    </ButtonWithToolTip>
                                )
                                : null}
                            {canCreateMapThumbnail ? <ButtonWithToolTip
                                variant="primary"
                                size="xs"
                                square
                                onClick={() => onEnableMapThumbnailViewer(true)}
                                tooltipId="gnviewer.saveMapThumbnail"
                                tooltipPosition={"top"}
                                disabled={resourceThumbnailUpdating}
                            >
                                <Icon glyph="1-map" type="glyphicon"/>
                            </ButtonWithToolTip> : null}
                            <ButtonWithToolTip
                                variant="primary"
                                size="xs"
                                square
                                onClick={() => onChange('')}
                                tooltipId="resourcesCatalog.removeThumbnail"
                                tooltipPosition={"top"}
                                disabled={resourceThumbnailUpdating}
                            >
                                {resourceThumbnailUpdating ? <Spinner /> : <Icon glyph="trash" type="glyphicon"/>}
                            </ButtonWithToolTip>
                        </FlexBox>
                    </>
                : <>
                    {thumbnail ? <img src={thumbnail}/> : null}
                </>}
            {(resourceThumbnailUpdating || savingThumbnailMap) ? <div className="_fill _absolute _corner-tr" /> : null}
        </FlexBox>
    );
}

export default DetailsThumbnail;
