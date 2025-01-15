import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import './index.css';
import 'primeicons/primeicons.css';

console.log(Aura);

const routes = [
  { path: '/', component: Home },
  { path: '/grid', component: () => import('./components/Grid.vue') },
  { path: '/cv', component: () => import('./pages/CVs/CVGabriel.vue') },
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
app.use(PrimeVue, { theme: { preset: MyPreset } });
app.use(router);
app.mount('#app');

function makeTheme() {
  const MyPreset = definePreset(Aura, {
    semantic: {
      primary: {
        50: '{sky.50}',
        100: '{sky.100}',
        200: '{sky.200}',
        300: '{sky.300}',
        400: '{sky.400}',
        500: '{sky.500}',
        600: '{sky.600}',
        700: '{sky.700}',
        800: '{sky.800}',
        900: '{sky.900}',
        950: '{sky.950}',
      },
    },
  });

  return { MyPreset };
}
