/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect, useRef, useState } from 'react';
import BaseMap from '@mapstore/framework/components/map/BaseMap';
import mapTypeHOC from '@mapstore/framework/components/map/enhancers/mapType';
import { MapLibraries } from '@mapstore/framework/utils/MapTypeUtils';
import turfCenter from '@turf/center';
import { getCapabilities } from '@mapstore/framework/api/Model';
import { METERS_PER_UNIT } from '@mapstore/framework/utils/MapUtils';
import * as Cesium from 'cesium';
import MainLoader from '@js/components/MainLoader';

const Map = mapTypeHOC(BaseMap);
Map.displayName = 'Map';

const getLayer = {
    gltf: ({
        feature,
        url
    }) => Promise.resolve({
        type: 'vector',
        visibility: true,
        features: [feature],
        style: {
            format: 'geostyler',
            body: {
                name: '',
                rules: [
                    {
                        name: '',
                        symbolizers: [
                            {
                                kind: 'Model',
                                model: url
                            }
                        ]
                    }
                ]
            }
        }
    }),
    ifc: ({
        feature,
        url
    }) => {
        return getCapabilities(url)
            .then((capabilities) => {
                return {
                    type: 'model',
                    visibility: true,
                    url,
                    features: [feature],
                    capabilities
                };
            });
    }
};

const setupScenes = {
    gltf: ({
        map,
        setLoading
    }) => {
        useEffect(() => {
            // disable depth test to see model underground
            map.scene.globe.depthTestAgainstTerrain = false;
            // remove terrain collision with camera
            map.scene.screenSpaceCameraController.enableCollisionDetection = false;
            const datasource = map.dataSources.get(0);
            const setup = () => {
                if (datasource.entities.values[0]) {
                    map.flyTo(datasource.entities.values[0], { duration: 0 });
                    setLoading(false);
                }
            };
            datasource.entities.collectionChanged.addEventListener(setup);
            return () => {
                datasource.entities.collectionChanged.removeEventListener(setup);
            };
        }, []);
        return null;
    },
    ifc: ({
        map,
        setLoading,
        container,
        center,
        layer
    }) => {
        const [info, setInfo] = useState({});
        const containetClientRect = container?.getBoundingClientRect();
        function handleInfoPosition() {
            const minSize = 768;
            if (containetClientRect.width < minSize || containetClientRect.height < minSize) {
                return {
                    left: 0,
                    top: 0,
                    transform: 'translateX(1rem) translateY(1rem)'
                };
            }
            const left = info?.x;
            const top = info?.y;
            const translateX = left > containetClientRect.width / 2 ? 'translateX(calc(-100% - 1rem))' : 'translateX(1rem)';
            const translateY = top > containetClientRect.height / 2 ? 'translateY(calc(-100% - 1rem))' : 'translateY(1rem)';
            return {
                left,
                top,
                transform: `${translateX} ${translateY}`
            };
        }
        function getMaxPropertyWidth() {
            const maxKeyLength = Object.keys(info.properties || {}).reduce((previous, current) => previous.length > current.length ? previous : current);
            return maxKeyLength.length ? `${maxKeyLength.length * 0.5}rem` : 'auto';
        }
        useEffect(() => {
            const { properties } = layer?.capabilities || {};
            const { size = [100, 100, 100] } = properties || {};
            const [longitude, latitude] = center?.geometry?.coordinates || [0, 0];
            const Rectangle = Cesium.Rectangle.fromDegrees(
                (longitude || 0) - ((size[0] / 2) / METERS_PER_UNIT.degrees),
                (latitude || 0) - ((size[1] / 2) / METERS_PER_UNIT.degrees),
                (longitude || 0) + ((size[0] / 2) / METERS_PER_UNIT.degrees),
                (latitude || 0) + ((size[1] / 2) / METERS_PER_UNIT.degrees)
            );
            map.camera.setView({ destination: Rectangle });
            setLoading(false);
        }, [layer]);
        useEffect(() => {
            const handler = new Cesium.ScreenSpaceEventHandler(map.scene.canvas);
            let highlight;
            handler.setInputAction((movement) => {
                const feature = map.scene.pick(movement.endPosition);
                setInfo({});
                if (highlight) {
                    const attributes = highlight.primitive.getGeometryInstanceAttributes(highlight.id);
                    attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(new Cesium.Color(...highlight.color));
                    highlight = undefined;
                    map.scene.requestRender();
                }
                const { primitive, id } = feature || {};
                if (primitive && primitive._msGetFeatureById) {
                    const attributes = primitive.getGeometryInstanceAttributes(id);
                    highlight = {
                        id,
                        color: [attributes.color[0] / 255, attributes.color[1] / 255, attributes.color[2] / 255, attributes.color[3] / 255],
                        primitive
                    };
                    attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.RED);
                    map.scene.requestRender();
                    const value = primitive._msGetFeatureById(id);
                    setInfo({
                        x: movement.endPosition.x,
                        y: movement.endPosition.y,
                        properties: value?.feature?.properties
                    });
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            return () => {
                handler.destroy();
            };
        }, []);
        return (
            info?.properties ? (
                <div
                    className="shadow gn-media-scene-3d-info gn-details-info-fields"
                    style={{
                        position: 'absolute',
                        zIndex: 10,
                        padding: '0.25rem',
                        pointerEvents: 'none',
                        maxWidth: containetClientRect.width * 3 / 2,
                        wordBreak: 'break-word',
                        transition: '0.3s all',
                        minWidth: 300,
                        userSelect: 'none',
                        ...handleInfoPosition()
                    }}
                >
                    <div className="gn-media-scene-3d-info-bg" style={{ opacity: 0.85, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}/>
                    {Object.keys(info.properties).map((key) => {
                        return (
                            <div key={key} className="gn-details-info-row">
                                <div className="gn-details-info-label" style={{ width: getMaxPropertyWidth() }}>
                                    {key}
                                </div>
                                <div className="gn-details-info-value" style={{ maxWidth: 'none'}}>
                                    {info.properties[key]}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null
        );
    }
};

function Scene3DViewer({
    src,
    mediaType,
    bboxPolygon
}) {

    const container = useRef();
    const [loading, setLoading] = useState(true);
    const [layer, setLayer] = useState(null);
    const center = bboxPolygon
        ? turfCenter(bboxPolygon)
        : { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} };

    const SetupScene = setupScenes[mediaType];

    useEffect(() => {
        if (getLayer[mediaType]) {
            getLayer[mediaType]({
                url: src,
                feature: center
            }).then((newLayer) => {
                setLayer(newLayer);
            });
        }
    }, [mediaType]);

    return (
        <div ref={container} className="gn-media-scene-3d">
            {layer ? <Map
                id="gn-media-scene-3d-map"
                mapType={MapLibraries.CESIUM}
                map={{
                    registerHooks: false,
                    projection: 'EPSG:4326'
                }}
                styleMap={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%'
                }}
                eventHandlers={{}}
                layers={[layer]}
            >
                <SetupScene
                    src={src}
                    center={center}
                    container={container.current}
                    setLoading={setLoading}
                    layer={layer}
                />
            </Map> : null}
            {loading ? <MainLoader /> : null}
        </div>
    );
}

export default Scene3DViewer;
