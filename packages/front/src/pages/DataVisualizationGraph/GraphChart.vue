<template>
  <div class="w-full min-h-screen bg-pink-100" ref="container"></div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import data from './data.json';
import { onMounted, ref } from 'vue';
import { MyNode } from './MyGraph';

type RawNodeData = { path: string; children: string[] };
type NodeData = {
  id: string;
  children: string[];
  group: number;
};
type LinkData = {
  source: MyD3Node;
  target: MyD3Node;
  id: string;
};

type MyD3Node = MyNode<NodeData> & d3.SimulationNodeDatum;

const { nodes, links } = makeDirectAcyclic(data);

function nodeFolder(path: string) {
  return path.split('/').slice(0, -1).join('/');
}

function makeDirectAcyclic(data: RawNodeData[]) {
  const allFolders = new Map<string, number>();
  const nodes: NodeData[] = data.map((data) => {
    return {
      id: data.path,
      children: data.children,
      group: 0,
    };
  });

  const nodeMap = new Map<string, NodeData>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    const folder = nodeFolder(node.id);
    const currentCount = allFolders.get(folder) ?? allFolders.size;
    allFolders.set(folder, currentCount);
    node.group = currentCount;
  });

  const myNodesMap = new Map<string, MyNode<NodeData>>();

  function makeMyNode(node: NodeData): MyNode<NodeData> {
    if (myNodesMap.has(node.id)) {
      return myNodesMap.get(node.id)!;
    }
    const myNodeRoot = new MyNode(node, []);
    node.children.forEach((childPath) => {
      const childNode = nodeMap.get(childPath);
      if (childNode) {
        const myChildNode = makeMyNode(childNode);
        myNodeRoot.addChild(myChildNode);
      }
    });
    myNodesMap.set(node.id, myNodeRoot);
    return myNodeRoot;
  }

  const myNode = makeMyNode(nodes[0]); // Start from the first node
  myNode.turnIntoDAG();

  const myLinks = myNode.getLinks() as LinkData[];
  const myNodesArr: MyD3Node[] = [...new Set([...myNode.iter()])];

  return { nodes: myNodesArr, links: myLinks };
}

function makeNodesAndLinks(data: RawNodeData[]) {}

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
      d3
        .forceLink(links)
        .strength(1)
        .distance(20)
        .id((d: any) => d.id)
    )
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', ticked);

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;') as any as d3.Selection<
    SVGSVGElement,
    MyD3Node,
    null,
    undefined
  >;

  // Add a line for each link, and a circle for each node.
  const link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll()
    .data(links)
    .join('line');

  const node = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll()
    .data(nodes)
    .join('circle')
    .attr('r', 5)
    .attr('fill', (d: MyD3Node) => color(d.data.group.toString()));

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
      .attr('x1', (d) => d.source.x ?? 0)
      .attr('y1', (d) => d.source.y ?? 0)
      .attr('x2', (d) => d.target.x ?? 0)
      .attr('y2', (d) => d.target.y ?? 0);
    node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
  }

  return svg.node()!;
}
</script>
