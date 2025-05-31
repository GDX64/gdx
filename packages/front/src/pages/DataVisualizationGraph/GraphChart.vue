<template>
  <div class="w-full min-h-screen bg-pink-100" ref="container"></div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import data from './data.json';
import { onMounted, ref } from 'vue';

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
      id: `${data.path}-${child}`,
    };
  });
});

const container = ref<HTMLElement | null>(null);
onMounted(() => {
  if (container.value) {
    const { width, height } = container.value.getBoundingClientRect();
    const svgNode = startChart({ width, height });
    container.value.appendChild(svgNode);
  }
});

function startChart({ width = 928, height = 600 } = {}) {
  // Specify the color scale.
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  // const { nodes, links } = exampleData;
  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3.forceLink(links).id((d: any) => d.id)
    )
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', ticked);

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;');

  // Add a line for each link, and a circle for each node.
  const link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll()
    .data(links)
    .join('line')
    .attr('stroke-width', (d) => 1);

  const node = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll()
    .data(nodes)
    .join('circle')
    .attr('r', 5)
    .attr('fill', (d) => '#ff0000');

  node.append('title').text((d) => d.id);

  // Add a drag behavior.
  const d3Drag = d3
    .drag()
    .on('start', (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on('drag', (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on('end', (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });

  node.call(d3Drag as any);

  // Set the position attributes of links and nodes each time the simulation ticks.
  function ticked() {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);
    node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
  }

  return svg.node()!;
}
</script>
