"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cloneNormalizedScene } from "./modelScene";

type ModelAsset = {
  id: string;
  name: string;
  path: string;
  size?: number;
};

type ModelViewerProps = {
  models: ModelAsset[];
};

function CameraControls() {
  const { camera, gl } = useThree();
  const controls = useMemo(
    () => new OrbitControls(camera, gl.domElement),
    [camera, gl],
  );

  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.panSpeed = 0.75;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 1.2;
    controls.maxDistance = 8;
    controls.target.set(0, 0.45, 0);
    controls.update();

    return () => controls.dispose();
  }, [controls]);

  useFrame(() => controls.update());

  return null;
}

function LoadedModel({ asset }: { asset: ModelAsset }) {
  const gltf = useLoader(GLTFLoader, asset.path);
  const { scene, scale } = useMemo(() => {
    return cloneNormalizedScene(gltf.scene, {
      alignToFloor: true,
      removePlaceholderCube: true,
      targetSize: asset.size ?? 1.6,
    });
  }, [asset.size, gltf.scene]);

  return (
    <group scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function ModelStage({ asset }: { asset: ModelAsset }) {
  return (
    <Canvas
      className="model-viewer-canvas"
      camera={{ position: [2.2, 1.6, 2.8], fov: 42 }}
      shadows
    >
      <color attach="background" args={["#eef5f6"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
      <spotLight
        position={[-2.4, 3.2, 2.2]}
        angle={0.5}
        penumbra={0.7}
        intensity={1.1}
        color="#dff9ff"
      />
      <Suspense fallback={null}>
        <LoadedModel asset={asset} />
      </Suspense>
      <gridHelper
        args={[4.5, 18, "#8396a1", "#d3e0e3"]}
        position={[0, -0.01, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#f6fbfb" roughness={0.72} />
      </mesh>
      <CameraControls />
    </Canvas>
  );
}

export default function ModelViewer({ models }: ModelViewerProps) {
  const [selectedId, setSelectedId] = useState(models[0]?.id);
  const selectedModel =
    models.find((model) => model.id === selectedId) ?? models[0];

  if (!selectedModel) {
    return (
      <main className="model-viewer-page">
        <div className="model-empty">No models found.</div>
      </main>
    );
  }

  return (
    <main className="model-viewer-page">
      <aside className="model-viewer-sidebar">
        <Link className="model-back-link" href="/">
          Back
        </Link>
        <div>
          <p className="model-eyebrow">Model Lab</p>
          <h1>3D Asset Viewer</h1>
        </div>
        <div className="model-list" aria-label="Available 3D models">
          {models.map((model) => (
            <button
              key={model.id}
              className={model.id === selectedModel.id ? "is-selected" : ""}
              type="button"
              onClick={() => setSelectedId(model.id)}
            >
              <span>{model.name}</span>
              <small>{model.path}</small>
            </button>
          ))}
        </div>
      </aside>
      <section
        className="model-viewer-stage"
        aria-label={`${selectedModel.name} 3D model viewer`}
      >
        <ModelStage asset={selectedModel} />
      </section>
    </main>
  );
}
