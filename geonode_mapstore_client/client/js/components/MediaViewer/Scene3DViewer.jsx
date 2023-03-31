/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html, useProgress } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { parseDevHostname } from '@js/utils/APIUtils';

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
        onChange({ center: [center.x || 0, center.y || 0, center.z || 0], radius });
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
        onChange({ center: [center.x || 0, center.y || 0, center.z || 0], radius });
    }, [radius, center?.x, center?.y, center?.z]);
    return pcd ? <primitive object={pcd} /> : null;
}

const modelTypes = {
    gltf: GLTFModel,
    pcd: PCDModel
};

function Scene3DViewer({
    src,
    mediaType,
    // file from https://github.com/pmndrs/drei-assets
    // https://polyhaven.com/a/studio_small_03
    environmentFiles = '/static/mapstore/img/studio_small_03_1k.hdr'
}) {
    const [boundingSphere, setBoundingSphere] = useState({
        radius: 10,
        center: [0, 0, 0]
    });
    const Model = modelTypes[mediaType];
    return (
        <div className="gn-media-scene-3d">
            <Suspense fallback={null}>
                <Canvas>
                    <Suspense fallback={null}>
                        <Environment files={environmentFiles} />
                    </Suspense>
                    <Suspense fallback={<Loader />}>
                        <Model src={src} onChange={setBoundingSphere}/>
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
        </div>
    );
}

export default Scene3DViewer;
