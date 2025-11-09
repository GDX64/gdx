import { createRoot } from './renderer/renderer';
import TestApp from './TestApp.vue';
import './style.css';

main();

async function main() {
  const appDiv = document.getElementById('app')!;
  createRoot(TestApp, appDiv);
}
