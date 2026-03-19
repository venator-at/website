import { getNodesBounds, getViewportForBounds, type Node } from "@xyflow/react";
import { toPng, toSvg } from "html-to-image";

interface ExportGraphOptions {
  container: HTMLElement;
  nodes: Node[];
  fileName: string;
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

function getExportStyle(options: ExportGraphOptions): {
  width: number;
  height: number;
  style: Record<string, string>;
} {
  const bounds = getNodesBounds(options.nodes);

  const padding = 120;
  const exportWidth = Math.max(1200, bounds.width + padding * 2);
  const exportHeight = Math.max(720, bounds.height + padding * 2);

  const viewport = getViewportForBounds(
    bounds,
    exportWidth,
    exportHeight,
    0.1,
    2,
    0.12,
  );

  return {
    width: exportWidth,
    height: exportHeight,
    style: {
      width: `${exportWidth}px`,
      height: `${exportHeight}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      transformOrigin: "top left",
      background:
        "radial-gradient(circle at 10% 10%, #0f172a 0%, #111827 34%, #1e1b4b 68%, #111827 100%)",
    },
  };
}

export async function exportGraphAsPng(options: ExportGraphOptions): Promise<void> {
  const viewportElement = options.container.querySelector(".react-flow__viewport") as HTMLElement | null;

  if (!viewportElement || options.nodes.length === 0) {
    return;
  }

  const { width, height, style } = getExportStyle(options);
  const dataUrl = await toPng(viewportElement, {
    cacheBust: true,
    width,
    height,
    pixelRatio: 2,
    style,
  });

  downloadDataUrl(dataUrl, options.fileName);
}

export async function exportGraphAsSvg(options: ExportGraphOptions): Promise<void> {
  const viewportElement = options.container.querySelector(".react-flow__viewport") as HTMLElement | null;

  if (!viewportElement || options.nodes.length === 0) {
    return;
  }

  const { width, height, style } = getExportStyle(options);
  const dataUrl = await toSvg(viewportElement, {
    cacheBust: true,
    width,
    height,
    style,
  });

  downloadDataUrl(dataUrl, options.fileName);
}
