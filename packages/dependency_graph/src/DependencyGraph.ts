import ts from "typescript";
import path from "path";
import fs from "fs/promises";

export interface GraphNode {
  children: GraphNode[];
  fileName: string;
  filePath: string;
  isLibrary: boolean;
  package: string | null;
  parent: GraphNode | null;
}

export class DependencyGraph {
  config!: {
    compilerOptions: ts.CompilerOptions;
    moduleResolutionHost: ts.ModuleResolutionHost;
  };

  static async create(sourcePath: string) {
    const me = new DependencyGraph();
    const tsConfigFilePath = ts.findConfigFile(sourcePath, ts.sys.fileExists);
    if (!tsConfigFilePath) {
      throw new Error("tsconfig.json not found");
    }
    me.config = await getCompilerOptionsAndHost(tsConfigFilePath);
    return me.getDependencyGraph(sourcePath, sourcePath);
  }

  async getDependencyGraph(
    sourcePath: string,
    fileName: string,
    parent?: GraphNode
  ): Promise<GraphNode | null> {
    if (parent && isCircularDependency(parent, fileName)) {
      return null;
    }

    const resolvedModule = ts.bundlerModuleNameResolver(
      fileName,
      sourcePath,
      this.config.compilerOptions,
      this.config.moduleResolutionHost
    );
    if (!resolvedModule.resolvedModule) {
      return null;
    }
    const {
      isExternalLibraryImport,
      resolvedFileName: _resolved,
      packageId,
    } = resolvedModule.resolvedModule;
    const resolvedFileName = adjustFileName(_resolved);
    const thisNode: GraphNode = {
      children: [],
      fileName: path.basename(resolvedFileName),
      filePath: resolvedFileName,
      isLibrary: isExternalLibraryImport ?? false,
      package: packageId?.name ?? null,
      parent: parent ?? null,
    };
    if (thisNode.isLibrary) {
      return thisNode;
    }
    const data = await readFile(resolvedFileName);
    if (!data) {
      return null;
    }
    const { importedFiles } = ts.preProcessFile(data);
    const all = importedFiles.map(async (importedFile) => {
      const child = await this.getDependencyGraph(
        resolvedFileName,
        importedFile.fileName,
        thisNode
      );
      if (child) {
        return child;
      }
      const dir = path.dirname(resolvedFileName);
      const file = path.resolve(dir, importedFile.fileName);
      return <GraphNode>{
        children: [],
        fileName: path.basename(file),
        filePath: file,
        isLibrary: false,
        package: null,
        parent: thisNode ?? null,
      };
    });

    const children = await Promise.all(all);
    thisNode.children = children;
    const result: GraphNode = {
      children,
      fileName: path.basename(resolvedFileName),
      filePath: resolvedFileName,
      isLibrary: isExternalLibraryImport ?? false,
      package: packageId?.name ?? null,
      parent: parent ?? null,
    };
    return result;
  }
}

function isCircularDependency(node: GraphNode, filePath: string) {
  if (node.filePath === filePath) {
    return true;
  }
  if (node.parent) {
    return isCircularDependency(node.parent, filePath);
  }
  return false;
}

function getCompilerOptionsAndHost(tsConfigFilePath: string) {
  // Step 1: Read and parse the tsconfig.json file
  const configFile = ts.readJsonConfigFile(tsConfigFilePath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonSourceFileConfigFileContent(
    configFile,
    ts.sys,
    path.dirname(tsConfigFilePath)
  );

  // Step 2: Extract the compiler options
  const compilerOptions = parsedConfig.options;

  // Step 3: Create a ModuleResolutionHost
  const moduleResolutionHost: ts.ModuleResolutionHost = {
    fileExists: fileExists,
    readFile: readFile,
    directoryExists: ts.sys.directoryExists,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
  };

  return { compilerOptions, moduleResolutionHost };
}

function readFile(fileName: string) {
  return ts.sys.readFile(adjustFileName(fileName));
}

function fileExists(fileName: string) {
  return ts.sys.fileExists(adjustFileName(fileName));
}

function adjustFileName(fileName: string) {
  const isVueFile = fileName.includes(".vue");
  if (isVueFile) {
    const doesNotEndWithVue = !fileName.endsWith(".vue");
    if (doesNotEndWithVue) {
      return fileName.slice(0, -3);
    }
  }
  return fileName;
}

function flatGraph(graph: GraphNode): GraphNode[] {
  const flat = graph.children.flatMap((child) => {
    return flatGraph(child);
  });
  return [graph, ...flat];
}

export async function exportToCSV(graph: GraphNode, to: string) {
  const file1 = getCSVNames(graph);
  const file2 = getAllLinks(graph);

  try {
    await fs.mkdir(to, {});
  } catch (e) {
    console.log("Directory already exists.");
  }

  await fs.writeFile(path.resolve(to, "./names.csv"), file1, "utf8");

  await fs.writeFile(path.resolve(to, "./links.csv"), file2, "utf8");
}

function getCSVNames(graph: GraphNode) {
  const header = "filePath;fileName;folder;isLib\n";
  const flat = flatGraph(graph);
  const unique = uniqueBy(flat, (node) => node.filePath);
  const csvNames = unique.map((node) => {
    const fileName = node.fileName.toLocaleLowerCase();
    const filePath = node.filePath.toLocaleLowerCase();
    const folder = path.dirname(filePath).toLocaleLowerCase();
    const isLib = node.isLibrary ? "true" : "false";
    return `${filePath};${fileName};${folder};${isLib}`;
  });
  const body = csvNames.join("\n");
  const file1 = header + body + "\n";
  return file1;
}

function getAllLinks(graph: GraphNode) {
  const flat = uniqueBy(flatGraph(graph), (node) => node.filePath);
  const links = flat.flatMap((node) => {
    return node.children.map((child) => {
      return `${node.filePath};${child.filePath}`;
    });
  });
  const body = links.join("\n");
  const header = "source,target\n";
  const file2 = header + body + "\n";
  return file2;
}

function uniqueBy<T>(array: T[], fn: (val: T) => string): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = fn(item);
    if (seen.has(value)) {
      return false;
    } else {
      seen.add(value);
      return true;
    }
  });
}
