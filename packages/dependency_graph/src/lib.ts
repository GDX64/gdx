import ts from "typescript";
import path, { resolve } from "path";

export interface GraphNode {
  children: GraphNode[];
  fileName: string;
  filePath: string;
  isLibrary: boolean;
  package?: string;
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
    _sourcePath: string,
    _fileName: string
  ): Promise<GraphNode | null> {
    const sourcePath = adjustFileName(_sourcePath);
    const fileName = adjustFileName(_fileName);
    const resolvedModule = ts.bundlerModuleNameResolver(
      fileName,
      sourcePath,
      this.config.compilerOptions,
      this.config.moduleResolutionHost
    );
    console.log(resolvedModule);
    if (!resolvedModule.resolvedModule) {
      return null;
    }
    if (resolvedModule.resolvedModule.isExternalLibraryImport) {
      return <GraphNode>{
        children: [],
        fileName: path.basename(resolvedModule.resolvedModule.resolvedFileName),
        filePath: resolvedModule.resolvedModule.resolvedFileName,
        isLibrary: true,
        package: resolvedModule.resolvedModule.packageId?.name,
      };
    }
    const data = await readFile(sourcePath);
    if (!data) {
      return null;
    }
    const file = ts.preProcessFile(data);
    const all = file.importedFiles.map(async (importedFile) => {
      const node = await this.getDependencyGraph(
        resolvedModule.resolvedModule!.resolvedFileName,
        importedFile.fileName
      );
      return node;
    });

    const nodes = await Promise.all(all);
    const children = nodes.filter((node) => node !== null);
    return {
      children,
      fileName: path.basename(sourcePath),
      filePath: sourcePath,
      isLibrary: resolvedModule.resolvedModule.isExternalLibraryImport ?? false,
      package: resolvedModule.resolvedModule.packageId?.name,
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
