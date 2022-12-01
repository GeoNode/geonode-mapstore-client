
/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from 'react';
import FaIcon from '@js/components/FaIcon';
import Button from '@js/components/Button';
import Message from '@mapstore/framework/components/I18N/Message';
import { ResourceTypes, GXP_PTYPES, getResourceImageSource } from '@js/utils/ResourceUtils';
import ThumbnailEditable from './ThumbnailEditable';
import BaseMap from '@mapstore/framework/components/map/BaseMap';
import mapTypeHOC from '@mapstore/framework/components/map/enhancers/mapType';
import Loader from '@mapstore/framework/components/misc/Loader';
import ZoomTo from '@js/components/ZoomTo';
import { boundsToExtentString } from '@js/utils/CoordinatesUtils';
import ThumbnailPreview from './ThumbnailPreview';
import tooltip from '@mapstore/framework/components/misc/enhancers/tooltip';
import { getConfigProp } from '@mapstore/framework/utils/ConfigUtils';

const MapThumbnailButtonToolTip = tooltip(Button);

const Map = mapTypeHOC(BaseMap);
Map.displayName = 'Map';

const EditThumbnail = ({ width, height, image, onEdit, thumbnailUpdating }) => (
    <div className="gn-details-text imagepreview">
        <ThumbnailEditable onEdit={onEdit} defaultImage={image} width={width} height={height}/>
        {thumbnailUpdating && <div className="gn-details-thumbnail-loader">
            <Loader size={50} />
        </div>
        }
    </div>
);

const MapThumbnailView = ({ initialBbox, layers, onMapThumbnail, onClose, savingThumbnailMap } ) => {
    const [currentBbox, setCurrentBbox] = useState();
    const { bounds, crs } = initialBbox;
    const extent = boundsToExtentString(bounds, crs);

    function handleOnMapViewChanges(center, zoom, bbox) {
        setCurrentBbox(bbox);
    }
    return (
        <>
            <div
                className="gn-detail-extent"
            >
                <Map
                    id="gn-filter-by-extent-map"
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
                {savingThumbnailMap && <div className="gn-details-thumbnail-loader">
                    <Loader size={50} />
                </div>
                }
            </div>
            <div className="gn-detail-extent-action">
                <Button className="btn-primary" onClick={() => onMapThumbnail(currentBbox)} ><Message msgId={"gnhome.apply"} /></Button><Button onClick={() => onClose(false) }><i className="fa fa-close"/></Button></div>
        </>
    );
};

function DetailsThumbnail({
    enabled,
    resource,
    activeEditMode,
    enableMapViewer,
    onResourceThumbnail,
    editThumbnail,
    resourceThumbnailUpdating,
    isThumbnailChanged,
    layers,
    onMapThumbnail,
    onClose,
    savingThumbnailMap,
    initialBbox,
    icon
}) {
    if (!enabled) {
        return null;
    }

    const { defaultThumbnailSize } = getConfigProp('geoNodeSettings');
    const { height = 200, width = 240 } = defaultThumbnailSize;
    const aspectRatio = width / height;

    const handleResourceThumbnailUpdate = () => {
        onResourceThumbnail();
    };

    return (
        <div className="gn-details-panel-content-img" >
            <div className="gn-details-panel-preview-wrapper" style={{ ...(aspectRatio && { aspectRatio: `${width} / ${height}` }) }}>
                {!activeEditMode && <ThumbnailPreview src={resource?.thumbnail_url} icon={icon} />}
                {activeEditMode && <div className="gn-details-panel-preview inediting">
                    {!enableMapViewer
                        ? <>
                            <EditThumbnail
                                onEdit={editThumbnail}
                                width={width}
                                height={height}
                                image={() => getResourceImageSource(resource?.thumbnail_url)}
                                thumbnailUpdating={resourceThumbnailUpdating}
                            />
                            {((resource.resource_type === ResourceTypes.MAP || resource.resource_type === ResourceTypes.DATASET)
                                && (resource.ptype !== GXP_PTYPES.REST_IMG || resource.ptype !== GXP_PTYPES.REST_MAP)) ?
                                <MapThumbnailButtonToolTip
                                    variant="default"
                                    onClick={() => onClose(!enableMapViewer)}
                                    className="map-thumbnail"
                                    tooltip={<Message msgId="gnviewer.saveMapThumbnail" />}
                                    tooltipPosition={"top"}
                                >
                                    <FaIcon name="map" />
                                </MapThumbnailButtonToolTip> : null}
                            {isThumbnailChanged ?
                                <Button
                                    style={{
                                        left: ((resource.resource_type === ResourceTypes.MAP || resource.resource_type === ResourceTypes.DATASET)
                                            && (resource.ptype !== GXP_PTYPES.REST_IMG || resource.ptype !== GXP_PTYPES.REST_MAP)) ? '85px' : '50px'
                                    }}
                                    variant="primary"
                                    className="map-thumbnail apply-button"
                                    onClick={handleResourceThumbnailUpdate}>
                                    <Message msgId={"gnhome.apply"} />
                                </Button> : null}
                        </>
                        : <MapThumbnailView
                            layers={layers}
                            onMapThumbnail={onMapThumbnail}
                            onClose={onClose}
                            savingThumbnailMap={savingThumbnailMap}
                            initialBbox={initialBbox}
                        />
                    }
                </div>}
            </div>
        </div>
    );
}

export default DetailsThumbnail;
