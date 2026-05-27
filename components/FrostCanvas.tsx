"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import { FridgeItemShape } from "./FridgeItemShapes";
import { fridgeItemOrder } from "./fridgeData";
import type { FridgeItem } from "./fridgeData";
import type { Group } from "three";

type FrostCanvasProps = {
  active: boolean;
  items: FridgeItem[];
};

function createFridgeItemPositions(width: number, height: number) {
  const topSpan = width * 0.72;
  const bottomSpan = width * 0.78;
  const topY = height * 0.13;
  const bottomY = -height * 0.14;

  return [
    [-topSpan / 2, topY, 0.12],
    [0, topY, 0.12],
    [topSpan / 2, topY, 0.12],
    [-bottomSpan / 2, bottomY, 0.14],
    [-bottomSpan / 6, bottomY, 0.14],
    [bottomSpan / 6, bottomY, 0.14],
    [bottomSpan / 2, bottomY, 0.14],
  ] as const;
}

function getResponsiveItemScale(width: number, height: number) {
  return Math.min(1.88, width / 2.35, height / 3.05);
}

function FridgeInterior3D({ active, items }: FrostCanvasProps) {
  const group = useRef<Group>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const viewport = useThree((state) => state.viewport);
  const arrangedItems = useMemo(
    () =>
      fridgeItemOrder
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is FridgeItem => Boolean(item)),
    [items],
  );
  const positions = useMemo(
    () => createFridgeItemPositions(viewport.width, viewport.height),
    [viewport.width, viewport.height],
  );
  const itemScale = getResponsiveItemScale(viewport.width, viewport.height);

  return (
    <group
      ref={group}
      visible={active}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    >
      {arrangedItems.map((item, index) => (
        <ItemMesh
          key={item.id}
          item={item}
          position={positions[index] ?? [0, 0, 0]}
          scale={itemScale}
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
  scale,
  hovered,
  onHover,
}: {
  item: FridgeItem;
  position: readonly [number, number, number];
  scale: number;
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
      (hovered ? 0.05 : 0) +
      Math.sin(clock.elapsedTime * 1.5 + position[0]) * 0.018;
    group.current.scale.setScalar(hovered ? scale * 1.09 : scale);
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
      <FridgeItemShape id={item.id} />
    </group>
  );
}

export default function FrostCanvas({ active, items }: FrostCanvasProps) {
  return (
    <Canvas
      className="frost-canvas"
      camera={{ position: [0, 0.02, 7.8], fov: 42 }}
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
