import ts from "typescript";
import path from "path";

interface GraphNode {
  children: GraphNode[];
  fileName: string;
  filePath: string;
  isLibrary: boolean;
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
    return me.getDependencyGraph(sourcePath);
  }

  async getDependencyGraph(sourcePath: string): Promise<GraphNode | null> {
    const data = await readFile(sourcePath);
    if (!data) {
      return null;
    }
    const file = ts.preProcessFile(data);
    const all = file.importedFiles.map(async (importedFile) => {
      const resolvedModule = ts.bundlerModuleNameResolver(
        importedFile.fileName,
        sourcePath,
        this.config.compilerOptions,
        this.config.moduleResolutionHost
      );
      if (!resolvedModule.resolvedModule) {
        return null;
      }
      if (resolvedModule.resolvedModule.isExternalLibraryImport) {
        return null;
      }
      const node = await this.getDependencyGraph(
        resolvedModule.resolvedModule.resolvedFileName
      );
      if (!node) {
        return null;
      }
      node.isLibrary =
        resolvedModule.resolvedModule.isExternalLibraryImport ?? false;
      return node;
    });

    const nodes = await Promise.all(all);
    const children = nodes.filter((node) => node !== null);
    return {
      children,
      fileName: path.basename(sourcePath),
      filePath: sourcePath,
      isLibrary: false,
    };
  }
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
  const isVueFile = fileName.includes(".vue");
  if (isVueFile) {
    const withoutTsJs = fileName.slice(0, -3);
    return ts.sys.readFile(withoutTsJs);
  }
  return ts.sys.readFile(fileName);
}

function fileExists(fileName: string) {
  const isVueFile = fileName.includes(".vue");
  if (isVueFile) {
    const withoutTsJs = fileName.slice(0, -3);
    return ts.sys.fileExists(withoutTsJs);
  }
  return ts.sys.fileExists(fileName);
}
