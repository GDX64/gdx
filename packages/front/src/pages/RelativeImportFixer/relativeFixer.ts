/**
 * Resolve paths like nodejs path.resolve
 */
function pathResolve(...paths: string[]): string {
  const isLastAbsolute = !paths[paths.length - 1].startsWith('.');
  if (isLastAbsolute) {
    return paths[paths.length - 1];
  }
  const resolvedPath = paths.reduce((acc, path) => {
    if (path.startsWith('/')) {
      // If the path is absolute, reset the accumulator
      return path;
    }
    // Otherwise, join the path to the accumulator
    return acc + '/' + path;
  }, '');

  // Normalize the path by resolving '..' and '.' segments
  const segments = resolvedPath.split('/').reduce<string[]>((acc, segment) => {
    if (segment === '..') {
      acc.pop();
    } else if (segment !== '.' && segment !== '') {
      acc.push(segment);
    }
    return acc;
  }, []);

  return '/' + segments.join('/');
}

function adjustImport(
  fileLocation: string,
  current: string,
  subPath: string,
  alias: string
): string {
  const absoluteCurrent = pathResolve(fileLocation, current);
  const isSubPath = absoluteCurrent.startsWith(subPath);
  if (isSubPath) {
    const replaceForAlias = absoluteCurrent.replace(subPath, alias);
    return replaceForAlias;
  }
  return current;
}

export function parseFilesImports(
  file: string,
  fileLocation: string,
  subPath: string,
  alias: string
): string {
  const lines = file.split('\n');
  const adjustedImports = lines.map((imp) => {
    const isImport = imp.startsWith('import');
    if (!isImport) {
      return imp;
    }
    const match = imp.match(/from\s+'(.+)'/)?.[1];
    const newImport = adjustImport(fileLocation, match!, subPath, alias);
    return imp.replace(match!, newImport);
  });
  return adjustedImports.join('\n');
}
