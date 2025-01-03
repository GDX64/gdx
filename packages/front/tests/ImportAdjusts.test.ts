import path from 'path';

describe('findSelected', () => {
  test('simple find path', () => {
    const newImport = adjustImport('/hello/hi/foo/bar/baz', '../hi.ts', '/hello/hi');
    expect(newImport).toBe('@ALIAS@/foo/bar/hi.ts');
  });
  test('parse imports', () => {
    const newImport = parseFilesImports(
      `
import { banana, morango } from '../v1';
import Abacaxi from './dialogmodule/superdom';

const a = new Abacaxi();
      `,
      '/glmachado/profitweb/profit/app/v2/submodules',
      '/glmachado/profitweb/profit/app'
    );
    console.log(newImport);
  });
});

const ALIAS = '@ALIAS@';

function adjustImport(fileLocation: string, current: string, subPath: string): string {
  const absoluteCurrent = path.join(fileLocation, current);
  const isSubPath = absoluteCurrent.startsWith(subPath);
  if (isSubPath) {
    const replaceForAlias = absoluteCurrent.replace(subPath, ALIAS);
    return replaceForAlias;
  }
  return current;
}

function parseFilesImports(file: string, fileLocation: string, subPath: string) {
  const lines = file.split('\n');
  const adjustedImports = lines.map((imp) => {
    const isImport = imp.startsWith('import');
    if (!isImport) {
      return imp;
    }
    const match = imp.match(/from\s+'(.+)'/)?.[1];
    const newImport = adjustImport(fileLocation, match!, subPath);
    return imp.replace(match!, newImport);
  });
  return adjustedImports.join('\n');
}
