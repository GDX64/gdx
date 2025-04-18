import { DependencyGraph } from "../src/lib";
import path from "path";
test("hello", async () => {
  const src = path.resolve(__dirname, "./example-project/main.ts");
  console.log(src);
  await DependencyGraph.create(src);
});
