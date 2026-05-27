"use client";

import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("../../components/ModelViewer"), {
  ssr: false,
});

const modelAssets = [
  {
    id: "books",
    name: "Books",
    path: "/models/books.glb",
    size: 1.75,
  },
  {
    id: "skateboard",
    name: "Skateboard",
    path: "/models/skateboard.glb",
    size: 1.4,
  },
  {
    id: "amp",
    name: "Amp",
    path: "/models/amp.glb",
    size: 1.5,
  },
];

export default function ModelViewerPage() {
  return <ModelViewer models={modelAssets} />;
}
