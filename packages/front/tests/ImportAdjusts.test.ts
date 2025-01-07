import { parseFilesImports } from '../src/pages/RelativeImportFixer/relativeFixer';

const ALIAS = '@ALIAS@';
describe('findSelected', () => {
  test('parse imports', () => {
    const newImport = parseFilesImports(
      `
import { banana, morango } from '../v1';
import Abacaxi from './dialogmodule/superdom';

const a = new Abacaxi();
      `,
      '/glmachado/profitweb/profit/app/v2/submodules',
      '/glmachado/profitweb/profit/app',
      ALIAS
    );
    console.log(newImport);
  });
});

/**
 * Resolve paths like nodejs path.resolve
 */
function pathResolve(...paths: string[]): string {
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
