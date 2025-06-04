<template>
  <div
    class="min-h-screen max-h-screen h-screen flex text-text-prime w-full overflow-hidden"
  >
    <div class="absolute top-0 left-0 right-0 p-4 w-fit">
      <div class="flex gap-2">
        <Button @click="makeSelectedTheRoot">Use Selected As Root</Button>
        <Button @click="selectedRoot = null">Use Main As Root</Button>
      </div>
      <p class="text-lg font-bold">
        <span>Codebase:</span>
        <a href="https://github.com/GDX64/gdx">https://github.com/GDX64/gdx</a>
      </p>
      <label class="flex items-center gap-2 w-fit">
        <Checkbox v-model="showAsDAG" binary></Checkbox>
        <span>Show as DAG</span>
        <i
          class="pi pi-info-circle"
          v-tooltip="
            'Show as Directed Acyclic Graph, with every node represented by its shortest path'
          "
        ></i>
      </label>
      <div class="">Selected: {{ currentSelectedNode }}</div>
    </div>
    <div class="bg-prime-100 flex-1 h-full" ref="container"></div>
    <div class="h-full max-h-full overflow-scroll !bg-bg-0 w-[400px]">
      <Tree
        :value="treeValue"
        v-model:expandedKeys="treeExpandedKeys"
        :filter="true"
        :selectionKeys="selectionKeys"
        @nodeSelect="onNodeSelected"
        selectionMode="single"
        class="!bg-bg-0"
      >
        <template #default="slotProps">
          <span class="flex gap-2 items-center">
            <p class="">
              {{ slotProps.node.label }}
            </p>
            <div
              class="w-4 h-4 rounded-full"
              :style="{ background: slotProps.node.data }"
            ></div>
          </span>
        </template>
      </Tree>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import data from './data.json';
import { computed, ref, watch } from 'vue';
import { MyNode } from './MyGraph';
import Checkbox from 'primevue/checkbox';
import vTooltip from 'primevue/tooltip';
import Button from 'primevue/button';
import Tree from 'primevue/tree';
import { TreeNode } from 'primevue/treenode';

const treeValue = ref<TreeNode[]>();

const showAsDAG = ref(true);

type RawNodeData = { path: string; children: string[] };
type NodeData = {
  id: string;
  children: string[];
  group: string;
};
type LinkData = {
  source: MyD3Node;
  target: MyD3Node;
  id: string;
};

type MyD3Node = MyNode<NodeData> & d3.SimulationNodeDatum;
type UIState = {
  container: HTMLElement | null;
  showAsDAG: boolean;
  selectedRoot: null | string;
};

const currentSelectedNode = ref<string | null>(null);
const selectedRoot = ref<null | string>(null);
const container = ref<HTMLElement | null>(null);
const treeExpandedKeys = ref<Record<string, boolean>>({});
const color = d3.scaleOrdinal(d3.schemeCategory10);
let d3NodeSelection: d3.Selection<
  SVGCircleElement | null,
  MyD3Node,
  SVGGElement,
  MyD3Node
>;

const selectionKeys = computed(() => {
  if (!currentSelectedNode.value) {
    return {};
  }
  return { [currentSelectedNode.value]: true };
});

function onNodeSelected(node: TreeNode) {
  console.log('Node selected:', node);
  currentSelectedNode.value = node.key;
  d3NodeSelection.attr('fill', fillFunction);
}

watch(
  (): UIState => {
    return {
      container: container.value,
      showAsDAG: showAsDAG.value,
      selectedRoot: selectedRoot.value,
    };
  },
  (uiState, _old, clear) => {
    const { container } = uiState;
    if (!container) {
      return;
    }

    const { width, height } = container.getBoundingClientRect();
    const { svg, simulation, fileSystemNode, expandedKeys, nodeSelection } = startChart(
      { width, height },
      uiState
    );
    treeValue.value = [fileSystemNode];
    treeExpandedKeys.value = expandedKeys;
    d3NodeSelection = nodeSelection;

    container.appendChild(svg.node()!);
    clear(() => {
      simulation.stop();
      svg.remove();
    });
  }
);

function makeSelectedTheRoot() {
  if (currentSelectedNode.value) {
    selectedRoot.value = currentSelectedNode.value;
  }
}

function nodeFolder(path: string) {
  return path.split('/').slice(0, -1).join('/');
}

function makeDirectAcyclic(data: RawNodeData[], uiState: UIState) {
  const allFolders = new Map<string, number>();
  const nodes: NodeData[] = data.map((data) => {
    return {
      id: data.path,
      children: data.children,
      group: '#ffffff',
    };
  });

  function folderColor(path: string): string {
    const folder = nodeFolder(path);
    const currentCount = allFolders.get(folder) ?? allFolders.size;
    allFolders.set(folder, currentCount);
    return color(currentCount.toString());
  }

  const nodeMap = new Map<string, NodeData>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    node.group = folderColor(node.id);
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

  let myNode;
  const mainRoot = makeMyNode(nodes[0]); // Start from the first node
  if (uiState.selectedRoot) {
    myNode = mainRoot.findNodeById(uiState.selectedRoot);
    if (!myNode) {
      throw new Error(`Node with id ${uiState.selectedRoot} not found`);
    }
  } else {
    myNode = mainRoot;
  }
  if (uiState.showAsDAG) {
    myNode.turnIntoDAG();
  }

  const myLinks = myNode.getLinks() as LinkData[];
  const myNodesArr: MyD3Node[] = [...new Set([...myNode.iter()])];
  const root = myNode;
  const expandedKeys: Record<string, boolean> = {};
  function mapeToFileSystemTreeNode(node: MyNode<any>): TreeNode {
    expandedKeys[node.id] = true; // Mark this node as expanded
    return {
      key: node.id,
      data: folderColor(node.id),
      label: node.id.split('/').pop() || node.id,
      children: node.children.map(mapeToFileSystemTreeNode),
    };
  }

  const fileSystemRoot = MyNode.fromFileSystemArr(data.map((item) => item.path));
  const fileSystemNode = mapeToFileSystemTreeNode(fileSystemRoot);

  return { nodes: myNodesArr, links: myLinks, root, fileSystemNode, expandedKeys };
}

function startChart({ width = 928, height = 600 }, uiState: UIState) {
  const { nodes, links, root, ...graphResult } = makeDirectAcyclic(data, uiState);
  // Specify the color scale.

  // const { nodes, links } = exampleData;
  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .strength(1)
        .distance(50)
        .id((d: any) => d.id)
    )
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2).strength(1))
    .on('tick', ticked);

  // Create the SVG container.
  const svg = d3
    .create('svg')

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
    .attr('stroke', '#000')
    .attr('stroke-width', 1)
    .selectAll()
    .data(nodes)
    .join('circle')
    .attr('r', 7)
    .attr('fill', fillFunction)
    .classed('node-svg-simulation', true);

  node.append('title').text((d) => d.id);

  node.on('click', (event, d) => {
    currentSelectedNode.value = d.id;
    node.attr('fill', fillFunction);
  });

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

    const { width, height } = container.value!.getBoundingClientRect();
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
  }

  return { svg, simulation, root, nodeSelection: node, ...graphResult };
}

function fillFunction(d: MyD3Node) {
  const isSelected = currentSelectedNode.value === d.id;
  if (isSelected) {
    return '#ffffff';
  }
  return color(d.data.group.toString());
}
</script>

<style>
.node-svg-simulation {
  cursor: pointer;
  transition: fill 0.3s ease;
}
.node-svg-simulation:hover {
  transform-origin: center;
  fill: #fff; /* Tomato color on hover */
}
</style>
