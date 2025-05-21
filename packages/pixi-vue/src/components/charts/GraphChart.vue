<template>
  <GRaw :drawFunction="drawFunction"></GRaw>
</template>

<script setup lang="ts">
import { GRaw } from "#els/appRenderers.ts";
import * as d3 from "d3";

const nodes: (d3.SimulationNodeDatum & { id: number })[] = [
  { id: 0 },
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
];

const links = [
  { source: nodes[0], target: nodes[1] },
  { source: nodes[1], target: nodes[2] },
  { source: nodes[2], target: nodes[0] },
  { source: nodes[2], target: nodes[3] },
  { source: nodes[3], target: nodes[4] },
  { source: nodes[4], target: nodes[0] },
  { source: nodes[4], target: nodes[1] },
  { source: nodes[0], target: nodes[3] },
  { source: nodes[1], target: nodes[4] },
];

const forceSimulation = d3
  .forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-100))
  .force("link", d3.forceLink(links).distance(100).strength(1))
  .force("center", d3.forceCenter(0, 0).strength(1));

function drawFunction(ctx: CanvasRenderingContext2D) {
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

  ctx.translate(-minX + 10, -minY + 10);

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
