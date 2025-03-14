import { UserConfig, configDefaults } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import auto from 'autoprefixer';
import tailwind from 'tailwindcss';
import mdPlugin, { Mode } from 'vite-plugin-markdown';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import { resolve } from 'path';

const root = searchForWorkspaceRoot(process.cwd());

// https://vitejs.dev/config/
export default defineConfig((args) => {
  const conifg: UserConfig = {
    worker: {
      plugins: [vue()],
    },
    plugins: [
      vue(),
      svgLoader() as any,
      mdPlugin({
        mode: [Mode.VUE],
      }),
    ],
    test: {
      globals: true,
      environment: 'happy-dom',
      exclude: [...configDefaults.exclude],
      include: ['./src/**/**.test.ts', './tests/**/**.test.ts'],
    },
    css: getCssConfig(args.mode),
    server: {
      fs: {
        // allow: [allowed],
        // strict: true,
      },
      host: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    build: {
      minify: false,
      sourcemap: false,
      target: 'es2022',
    },
    esbuild: {
      target: 'es2022',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
    },
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
      },
    },
  };

  return conifg;
});

function getCssConfig(mode: string) {
  if (mode === 'test') {
    return {};
  }
  return { postcss: { plugins: [auto(), tailwind()] } };
}
