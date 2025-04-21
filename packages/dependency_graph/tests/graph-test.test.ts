import { DependencyGraph, exportToCSV, GraphNode } from "../src/lib";
import path from "path";

test("hello", async () => {
  // const src = path.resolve(__dirname, "./example-project/main.ts");
  const src = path.resolve(__dirname, "../../front/src/main.ts");
  const graph = await DependencyGraph.create(src);
  const out = path.resolve(__dirname, "../public");

  exportToCSV(graph!, out);
});
