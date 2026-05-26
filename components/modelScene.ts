import { Box3, Vector3 } from "three";
import type { Mesh, Object3D } from "three";

type NormalizeModelOptions = {
  alignToFloor?: boolean;
  removePlaceholderCube?: boolean;
  targetSize: number;
};

export function cloneNormalizedScene(
  scene: Object3D,
  options: NormalizeModelOptions,
) {
  const clone = scene.clone(true);

  if (options.removePlaceholderCube) {
    const placeholderNodes: Object3D[] = [];
    clone.traverse((child) => {
      const mesh = child as Mesh;
      const vertexCount = mesh.isMesh
        ? mesh.geometry.attributes.position?.count
        : undefined;
      if (child.name === "Cube" && vertexCount === 24) {
        placeholderNodes.push(child);
      }
    });
    placeholderNodes.forEach((node) => node.parent?.remove(node));
  }

  const bounds = new Box3().setFromObject(clone);
  const size = new Vector3();
  const center = new Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);

  if (options.alignToFloor) {
    clone.position.set(-center.x, -bounds.min.y, -center.z);
  } else {
    clone.position.sub(center);
  }

  clone.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });

  return {
    scene: clone,
    scale: options.targetSize / (Math.max(size.x, size.y, size.z) || 1),
  };
}
