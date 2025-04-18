import { DependencyGraph, GraphNode } from "../src/lib";
import path from "path";
test("hello", async () => {
  const src = path.resolve(__dirname, "./example-project/main.ts");
  // const src = path.resolve(__dirname, "../../front/src/main.ts");
  console.log(src);
  const graph = await DependencyGraph.create(src);
  console.log(flatGraph(graph!));
});

function flatGraph(graph: GraphNode): GraphNode[] {
  const flat = graph.children.flatMap((child) => {
    return flatGraph(child);
  });
  return [graph, ...flat];
}
