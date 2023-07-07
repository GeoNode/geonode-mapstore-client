/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Suspense, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html, useProgress } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { parseDevHostname, getGeoNodeLocalConfig } from '@js/utils/APIUtils';
import { IFCLoader } from 'web-ifc-three/IFCLoader';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div className="gn-media-scene-3d-progress">
                <div style={{ width: `${progress}%` }}></div>
                {`${Math.round(progress)}%`}
            </div>
        </Html>
    );
}

function computeBoundingSphereFromGLTF(gltf) {
    if (gltf?.scene) {
        gltf.scene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        return { radius: size, center };
    }
    return { radius: 10, center: {x: 0, y: 0, z: 0 }};
}

function GLTFModel({ src, onChange }) {
    const gltf = useLoader(GLTFLoader, parseDevHostname(src));
    const { radius, center } = computeBoundingSphereFromGLTF(gltf);

    useEffect(() => {
        if (center) {
            onChange({ center: [center.x || 0, center.y || 0, center.z || 0], radius });
        }
    }, [radius, center?.x, center?.y, center?.z]);

    return gltf?.scene ? <primitive object={gltf.scene} /> : null;
}

function PCDModel({ src, onChange }) {
    const pcd = useLoader(PCDLoader, parseDevHostname(src));
    if (pcd) {
        pcd.geometry.computeBoundingSphere();
        if (pcd.material) {
            pcd.material.color = new THREE.Color(0x397AAB);
        }
    }
    const { radius, center } = pcd?.geometry?.boundingSphere || {};
    useEffect(() => {
        if (center) {
            onChange({ center: [center.x || 0, center.y || 0, center.z || 0], radius });
        }
    }, [radius, center?.x, center?.y, center?.z]);
    return pcd ? <primitive object={pcd} /> : null;
}

const highlight = new THREE.MeshLambertMaterial({
    transparent: true,
    opacity: 0.6,
    color: 0xff0000,
    depthTest: false
});

// references for the IFC Model implementation
// https://github.com/sebastianoscarlopez/ifc-react-fiber/tree/main
// https://github.com/IFCjs/hello-world/pull/54
function IFCModel({ src, sessionId, onChange, onUpdateInfo = () => {} }) {
    const ifc = useLoader(IFCLoader, parseDevHostname(`${src}?_v_=${sessionId}`), (loader) => {
        loader.ifcManager.setWasmPath(getGeoNodeLocalConfig('staticPath', '/static/') + 'mapstore/dist/js/web-ifc/');
        loader.ifcManager.state.api.isWasmPathAbsolute = true;
    });
    useEffect(() => {
        return () => {
            if (ifc?.ifcManager?.dispose) {
                ifc.ifcManager.dispose();
            }
        };
    }, []);
    const { radius, center } = ifc?.geometry?.boundingSphere || {};
    useEffect(() => {
        if (center) {
            onChange({ center: [center.x || 0, center.y || 0, center.z || 0], radius });
        }
    }, [radius, center?.x, center?.y, center?.z]);
    return ifc ? (
        <primitive
            object={ifc}
            onPointerLeave={() => {
                ifc.ifcManager.removeSubset(ifc.modelID, highlight);
                onUpdateInfo({});
            }}
            onPointerMove={(event) => {
                const { intersections = [] } = event || {};
                const intersected = intersections[0];
                const manager = intersected?.object?.ifcManager;
                if (manager && intersected?.object?.geometry) {
                    const index = intersected.faceIndex;
                    const geometry = intersected.object.geometry;
                    const modelID = intersected.object.modelID;
                    const expressId = manager.getExpressId(geometry, index);
                    manager.createSubset({
                        modelID,
                        ids: [ expressId ],
                        material: highlight,
                        scene: intersected?.object?.parent,
                        removePrevious: true
                    });
                    manager.getItemProperties(modelID, expressId).
                        then((props) => {
                            onUpdateInfo({
                                x: event.x,
                                y: event.y,
                                properties: Object.keys(props).reduce((acc, key) => {
                                    const value = isString(props[key]) || isNumber(props[key])
                                        ? props[key]
                                        : props[key]?.value;
                                    if (value === undefined || value === null) {
                                        return acc;
                                    }
                                    return {
                                        ...acc,
                                        [key]: value
                                    };
                                }, {})
                            });
                        });
                }
            }}
        />
    ) : null;
}

const modelTypes = {
    gltf: GLTFModel,
    pcd: PCDModel,
    ifc: IFCModel
};

function Scene3DViewer({
    src,
    mediaType,
    // file from https://github.com/pmndrs/drei-assets
    // https://polyhaven.com/a/studio_small_03
    environmentFiles = '/static/mapstore/img/studio_small_03_1k.hdr'
}) {
    // for ifc model we need to append the sessionId to the src
    // to avoid caching of the url
    const [sessionId] = useState(Date.now());
    const container = useRef();
    const [boundingSphere, setBoundingSphere] = useState({
        radius: 10,
        center: [0, 0, 0]
    });
    const [info, setInfo] = useState({});
    const Model = modelTypes[mediaType];
    const containetClientRect = container?.current?.getBoundingClientRect();
    function handleInfoPosition() {
        const minSize = 768;
        if (containetClientRect.width < minSize || containetClientRect.height < minSize) {
            return {
                left: 0,
                top: 0,
                transform: 'translateX(1rem) translateY(1rem)'
            };
        }
        const left = info?.x ? info.x - containetClientRect.left : 0;
        const top = info?.y ? info.y - containetClientRect.top : 0;
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
    return (
        <div ref={container} className="gn-media-scene-3d">
            <Suspense fallback={null}>
                <Canvas>
                    <ambientLight intensity={0.5} />
                    <directionalLight color="white" intensity={0.5} position={[10, 10, 10]} />
                    <Suspense fallback={null}>
                        <Environment files={environmentFiles} />
                    </Suspense>
                    <Suspense fallback={<Loader />}>
                        <Model sessionId={sessionId} src={src} onChange={setBoundingSphere} onUpdateInfo={(newInfo) => setInfo(newInfo)}/>
                    </Suspense>
                    <OrbitControls
                        makeDefault
                        enableDamping
                        minDistance={0}
                        maxDistance={boundingSphere.radius * 8}
                        target={[...boundingSphere.center]}
                    />
                    <PerspectiveCamera makeDefault fov={65} far={boundingSphere.radius * 12} position={[boundingSphere.center[0], boundingSphere.center[1], boundingSphere.radius * 2]}/>
                </Canvas>
            </Suspense>
            {info?.properties && (
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
            )}
        </div>
    );
}

export default Scene3DViewer;
