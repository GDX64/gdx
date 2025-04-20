import { Command } from "commander";
import { DependencyGraph, exportToCSV } from "../src/DependencyGraph";
import path from "path";
const program = new Command();

program.name("my-cli").description("An example CLI tool").version("1.0.0");

program
  .command("csv <root.ts>")
  .option("-o, --output <output>", "Output directory")
  .description("Run the CLI with a TypeScript file")
  .action(async (start, options) => {
    const { output } = options as { output?: string };
    const startPath = path.resolve(process.cwd(), start);
    const outPath = path.resolve(process.cwd(), output || "../public");
    const graph = await DependencyGraph.create(startPath);
    exportToCSV(graph!, outPath);
  });

program.parse(process.argv);
