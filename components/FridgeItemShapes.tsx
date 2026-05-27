"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { FridgeItemId } from "./fridgeData";
import { cloneNormalizedScene } from "./modelScene";

export function FridgeItemShape({ id }: { id: FridgeItemId }) {
  if (id === "tech") return <Laptop />;
  if (id === "music") return <Amp />;
  if (id === "school") return <Books />;
  if (id === "ride") return <Skateboard />;
  if (id === "travel") return <BeerGlass />;
  if (id === "socials") return <Phone />;
  return <Tools />;
}

function Laptop() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} scale={[0.56, 0.04, 0.34]}>
        <boxGeometry />
        <meshStandardMaterial
          color="#aebdcc"
          roughness={0.32}
          metalness={0.45}
        />
      </mesh>
      <mesh
        position={[0, 0.32, -0.13]}
        rotation={[-0.58, 0, 0]}
        scale={[0.52, 0.34, 0.04]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#263144"
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>
      <mesh
        position={[0, 0.34, -0.1]}
        rotation={[-0.58, 0, 0]}
        scale={[0.42, 0.24, 0.045]}
      >
        <boxGeometry />
        <meshBasicMaterial color="#83f8ff" />
      </mesh>
    </group>
  );
}

function Amp() {
  const gltf = useLoader(GLTFLoader, "/models/amp.glb");
  const ampScene = useMemo(() => {
    const normalized = cloneNormalizedScene(gltf.scene, { targetSize: 0.68 });
    normalized.scene.scale.setScalar(normalized.scale);

    return normalized.scene;
  }, [gltf.scene]);

  return (
    <group position={[0, 0.04, 0.02]} rotation={[0.02, -0.18, 0]}>
      <primitive object={ampScene} />
    </group>
  );
}

function Books() {
  const gltf = useLoader(GLTFLoader, "/models/books.glb");
  const bookScene = useMemo(() => {
    const normalized = cloneNormalizedScene(gltf.scene, {
      removePlaceholderCube: true,
      targetSize: 0.74,
    });
    normalized.scene.scale.setScalar(normalized.scale);

    return normalized.scene;
  }, [gltf.scene]);

  return (
    <group position={[0, 0.03, 0.02]} rotation={[0, -0.1, 0]}>
      <primitive object={bookScene} />
    </group>
  );
}

function Skateboard() {
  const gltf = useLoader(GLTFLoader, "/models/skateboard.glb");
  const skateboardScene = useMemo(() => {
    const normalized = cloneNormalizedScene(gltf.scene, { targetSize: 0.9 });
    normalized.scene.scale.setScalar(normalized.scale);

    return normalized.scene;
  }, [gltf.scene]);

  return (
    <group position={[0, 0.02, 0.02]} rotation={[0.5, -2, -0.12]}>
      <primitive object={skateboardScene} />
    </group>
  );
}

function BeerGlass() {
  const dots = [-0.08, 0, 0.08];

  return (
    <group>
      <mesh scale={[0.22, 0.48, 0.2]}>
        <cylinderGeometry args={[0.82, 0.62, 1, 32]} />
        <meshStandardMaterial
          color="#bac4c8"
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[0, 0.34, 0]} scale={[0.24, 0.06, 0.21]}>
        <cylinderGeometry args={[0.86, 0.86, 1, 32]} />
        <meshStandardMaterial
          color="#d5dcde"
          roughness={0.32}
          metalness={0.08}
        />
      </mesh>
      {dots.flatMap((x, col) =>
        dots.map((y, row) => (
          <mesh
            key={`${col}-${row}`}
            position={[x, y - 0.03, 0.19]}
            scale={0.018}
          >
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color="#677178" roughness={0.5} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Phone() {
  const appColors = [
    "#57d777",
    "#69b8ff",
    "#df69ff",
    "#f5c64c",
    "#7ef0db",
    "#f06464",
    "#9f83ff",
    "#5ae069",
    "#56b7ff",
  ];

  return (
    <group>
      <mesh scale={[0.25, 0.48, 0.045]}>
        <boxGeometry />
        <meshStandardMaterial
          color="#222833"
          roughness={0.42}
          metalness={0.18}
        />
      </mesh>
      <mesh position={[0, 0, 0.05]} scale={[0.2, 0.38, 0.02]}>
        <boxGeometry />
        <meshBasicMaterial color="#8ba5ff" />
      </mesh>
      {appColors.map((color, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        return (
          <mesh
            key={color}
            position={[-0.09 + col * 0.09, 0.13 - row * 0.12, 0.07]}
            scale={[0.026, 0.026, 0.01]}
          >
            <boxGeometry />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

function Tools() {
  const gltf = useLoader(GLTFLoader, "/models/hammer.glb");
  const hammerScene = useMemo(() => {
    const normalized = cloneNormalizedScene(gltf.scene, { targetSize: 0.72 });
    normalized.scene.scale.setScalar(normalized.scale);

    return normalized.scene;
  }, [gltf.scene]);

  return (
    <group>
      <group position={[0, 0, 0.02]} rotation={[0.08, -0.18, -0.08]}>
        <primitive object={hammerScene} />
      </group>
    </group>
  );
}
