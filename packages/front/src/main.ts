import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import ToastService from 'primevue/toastservice';
import './index.css';
import 'primeicons/primeicons.css';
import { primeColors } from './design/design';

const routes = [
  { path: '/', component: Home },
  { path: '/grid', component: () => import('./components/Grid.vue') },
  {
    path: '/data-visualization',
    component: () => import('./pages/DataVisualizationGraph/GraphChart.vue'),
  },
  { path: '/cv', component: () => import('./pages/CVs/CVGabriel.vue') },
  { path: '/cv_silvia', component: () => import('./pages/CVs/CVSilvia.vue') },
  { path: '/tippy', component: () => import('./pages/TippyTest.vue') },
  { path: '/layers', component: () => import('./pages/Layers.vue') },
  { path: '/noise', component: () => import('./pages/Noise/PerlinNoise.vue') },
  { path: '/base64', component: () => import('./pages/Base64.vue') },
  { path: '/wasm-chart', component: () => import('./pages/WasmChart.vue') },
  { path: '/gravity', component: () => import('./pages/Gravity.vue') },
  { path: '/projection', component: () => import('./pages/Projection/Projection.vue') },
  { path: '/libtest', component: () => import('./pages/LibTest.vue') },
  { path: '/canvas_game', component: () => import('./pages/CanvasGame.vue') },
  { path: '/stack', component: () => import('./pages/orderStack/OrderStack.vue') },
  { path: '/kite', component: () => import('./components/kite/Kite.vue') },
  { path: '/graph', component: () => import('./pages/graphs/Graphs.vue') },
  { path: '/yoga', component: () => import('./pages/YogaTest/YogaTest.vue') },
  { path: '/webgpu', component: () => import('./pages/webgpu/Webgpu.vue') },
  { path: '/logs', component: () => import('./pages/logview/LogView.vue') },
  {
    path: '/relative-imports-fix',
    component: () => import('./pages/RelativeImportFixer/RelativeImportsFixer.vue'),
  },
  {
    path: '/more-fun-stuff',
    component: () => import('./pages/MoreFunStuff/MoreFunStuff.vue'),
  },
  { path: '/space-index', component: () => import('./pages/spaceIndex/SpaceIndex.vue') },
  {
    path: '/audio-things',
    component: () => import('./pages/audioExperiments/AudiosThings.vue'),
  },
  {
    path: '/simd-rasterization',
    component: () => import('./pages/SIMDRasterization/SIMDRasterization.vue'),
  },
];

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: createWebHistory(),
  routes, // short for `routes: routes`
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: 'smooth' };
  },
});

const { MyPreset } = makeTheme();
const app = createApp(App);
app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: '.dark-mode',
    },
  },
});
app.use(router);
app.use(ToastService);
app.mount('#app');

function makeTheme() {
  const MyPreset = definePreset(Aura, {
    semantic: {
      primary: {
        ...primeColors,
      },
    },
  });

  return { MyPreset };
}
