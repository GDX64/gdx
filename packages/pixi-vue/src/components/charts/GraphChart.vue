<template>
  <GRaw :drawFunction="drawFunction" width="100%" height="100%"></GRaw>
</template>

<script setup lang="ts">
import { GRaw } from "#els/appRenderers.ts";
import * as d3 from "d3";
import data from "./data.json";
import { ElementInterface } from "#els/renderTypes.ts";

const nodes: (d3.SimulationNodeDatum & { id: string })[] = data.map((data) => {
  return {
    id: data.path,
  };
});

const links = data.flatMap((data) => {
  return data.children.map((child) => {
    return {
      source: nodes.find((node) => node.id === data.path)!,
      target: nodes.find((node) => node.id === child)!,
    };
  });
});

const forceSimulation = d3
  .forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-100))
  .force("link", d3.forceLink(links).distance(100).strength(1))
  .force("center", d3.forceCenter(0, 0).strength(1));

function drawFunction(
  ctx: CanvasRenderingContext2D,
  element: ElementInterface
) {
  const nodes = forceSimulation.nodes();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }
  });

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  ctx.translate(centerX, centerY);
  ctx.translate(element.getWidth() / 2, element.getHeight() / 2);

  links.forEach((link) => {
    const sourceNode = link.source;
    const targetNode = link.target;
    if (
      sourceNode?.x !== undefined &&
      sourceNode?.y !== undefined &&
      targetNode?.x !== undefined &&
      targetNode?.y !== undefined
    ) {
      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.stroke();
    }
  });

  nodes.forEach((node) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}
</script>
