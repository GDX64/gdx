import ts from "typescript";
import { promises as fs } from "fs";
import path from "path";

export class DependencyGraph {
  config!: {
    compilerOptions: ts.CompilerOptions;
    moduleResolutionHost: ts.ModuleResolutionHost;
  };

  static async create(sourcePath: string) {
    const me = new DependencyGraph();
    const tsConfigFilePath = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists
    );
    if (!tsConfigFilePath) {
      throw new Error("tsconfig.json not found");
    }
    me.config = await getCompilerOptionsAndHost(tsConfigFilePath);
    return me.getDependencyGraph(sourcePath);
  }

  async getDependencyGraph(sourcePath: string) {
    const data = await fs.readFile(sourcePath, "utf8");
    const file = ts.preProcessFile(data);
    console.log(file.importedFiles);
    const all = file.importedFiles.map(async (importedFile) => {
      const resolvedModule = ts.resolveModuleName(
        importedFile.fileName,
        sourcePath,
        this.config.compilerOptions,
        this.config.moduleResolutionHost
      );
      console.log(resolvedModule);
      if (!resolvedModule.resolvedModule) {
        return;
      }
      if (resolvedModule.resolvedModule.isExternalLibraryImport) {
        return;
      }
      return this.getDependencyGraph(
        resolvedModule.resolvedModule.resolvedFileName
      );
    });

    await Promise.all(all);
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
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    directoryExists: ts.sys.directoryExists,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
  };

  return { compilerOptions, moduleResolutionHost };
}
