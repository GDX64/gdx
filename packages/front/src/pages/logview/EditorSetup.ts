import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

export function startEditor(container: HTMLElement) {
  const editor = monaco.editor.create(container, {
    value: "// First line\nfunction hello() {\n\talert('Hello world!');\n}\n// Last line",
    language: 'javascript',

    lineNumbers: 'off',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    theme: 'vs-light',
    tabSize: 2,
  });
  editor.updateOptions({
    lineNumbers: 'on',
  });
  return editor;
}

export function loadMod(code: string) {
  const asUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  return import(asUrl);
}
