"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cloneNormalizedScene } from "./modelScene";
import type { Group } from "three";

type CanvasItem = {
  id: string;
};

type FrostCanvasProps = {
  active: boolean;
  items: CanvasItem[];
};

function FridgeInterior3D({ active, items }: FrostCanvasProps) {
  const group = useRef<Group>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const arrangedItems = useMemo(
    () =>
      ["school", "travel", "music", "ride", "socials", "hands", "tech"]
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is CanvasItem => Boolean(item)),
    [items],
  );
  const positions = [
    [-0.98, 0.72, 0.12],
    [0, 0.72, 0.12],
    [0.98, 0.72, 0.12],
    [-1.12, -0.48, 0.14],
    [-0.36, -0.48, 0.14],
    [0.36, -0.48, 0.14],
    [1.12, -0.48, 0.14],
  ] as const;

  return (
    <group
      ref={group}
      visible={active}
      position={[0, -0.08, 0]}
      rotation={[0, 0, 0]}
    >
      {arrangedItems.map((item, index) => (
        <ItemMesh
          key={item.id}
          item={item}
          position={positions[index] ?? [0, 0, 0]}
          hovered={hoveredId === item.id}
          onHover={setHoveredId}
        />
      ))}
    </group>
  );
}

function ItemMesh({
  item,
  position,
  hovered,
  onHover,
}: {
  item: CanvasItem;
  position: readonly [number, number, number];
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y =
      Math.sin(clock.elapsedTime * 0.8 + position[0]) * 0.08;
    group.current.position.y =
      position[1] +
      (hovered ? 0.08 : 0) +
      Math.sin(clock.elapsedTime * 1.5 + position[0]) * 0.018;
    group.current.scale.setScalar(hovered ? 1.1 : 0.94);
  });

  return (
    <group
      ref={group}
      position={[position[0], position[1], position[2]]}
      onPointerEnter={(event) => {
        event.stopPropagation();
        onHover(item.id);
      }}
      onPointerLeave={() => onHover(null)}
    >
      <ItemShape id={item.id} />
    </group>
  );
}

function ItemShape({ id }: { id: string }) {
  if (id === "tech") return <Laptop />;
  if (id === "music") return <Amp />;
  if (id === "school") return <Books />;
  if (id === "ride") return <Fingerboard />;
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
  return (
    <group>
      <mesh scale={[0.42, 0.58, 0.28]}>
        <boxGeometry />
        <meshStandardMaterial color="#3a2d3e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.16, 0.15]} scale={[0.28, 0.12, 0.035]}>
        <boxGeometry />
        <meshStandardMaterial color="#f3dd78" roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.13, 0.16]} scale={[0.25, 0.25, 0.03]}>
        <cylinderGeometry args={[1, 1, 1, 28]} />
        <meshStandardMaterial color="#151922" roughness={0.7} />
      </mesh>
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

function Fingerboard() {
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
  return (
    <group>
      <mesh
        position={[-0.16, 0, 0]}
        rotation={[0, 0, -0.1]}
        scale={[0.06, 0.54, 0.06]}
      >
        <boxGeometry />
        <meshStandardMaterial color="#a5653a" roughness={0.65} />
      </mesh>
      <mesh position={[-0.16, 0.33, 0]} scale={[0.13, 0.1, 0.06]}>
        <boxGeometry />
        <meshStandardMaterial
          color="#8b99a3"
          roughness={0.38}
          metalness={0.3}
        />
      </mesh>
      <mesh
        position={[0.18, 0, 0]}
        rotation={[0, 0, 0.16]}
        scale={[0.06, 0.62, 0.045]}
      >
        <boxGeometry />
        <meshStandardMaterial
          color="#aeb8bf"
          roughness={0.35}
          metalness={0.42}
        />
      </mesh>
      <mesh position={[0.18, 0.36, 0]} scale={[0.15, 0.12, 0.05]}>
        <torusGeometry args={[0.65, 0.18, 12, 20, Math.PI * 1.45]} />
        <meshStandardMaterial
          color="#aeb8bf"
          roughness={0.35}
          metalness={0.42}
        />
      </mesh>
    </group>
  );
}

export default function FrostCanvas({ active, items }: FrostCanvasProps) {
  return (
    <Canvas
      className="frost-canvas"
      camera={{ position: [0, 0.02, 7.2], fov: 42 }}
      shadows
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[-1.8, 3, 3]} intensity={1.8} />
      <pointLight
        position={[0, 0.2, 1.4]}
        intensity={active ? 1.8 : 0}
        color="#9ffcff"
      />
      <spotLight
        position={[0, 2.4, 2.6]}
        angle={0.5}
        penumbra={0.8}
        intensity={1.4}
        color="#c8fbff"
      />
      <Suspense fallback={null}>
        <FridgeInterior3D active={active} items={items} />
      </Suspense>
    </Canvas>
  );
}
