import { UserConfig, configDefaults } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import auto from 'autoprefixer';
import tailwind from 'tailwindcss';
import path from 'path';

// https://vitejs.dev/config/
export default (args) => {
  const conifg: UserConfig = {
    worker: {
      plugins: [makeVuePlugin()],
    },
    plugins: [makeVuePlugin(), svgLoader() as any],
    test: {
      globals: true,
      environment: 'happy-dom',
      exclude: [...configDefaults.exclude],
      include: ['./src/**/**.test.ts'],
    },
    css: getCssConfig(args.mode),
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
      host: true,
    },
    build: {
      minify: false,
      sourcemap: false,
    },
    resolve: {
      alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
        '@solidRender': path.resolve(__dirname, 'solidRender'),
      },
    },
  };

  return conifg;
};

function getCssConfig(mode: string) {
  if (mode === 'test') {
    return {};
  }
  return { postcss: { plugins: [auto(), tailwind()] } };
}

function makeVuePlugin() {
  return vue({
    template: {
      compilerOptions: {
        isCustomElement: (el) =>
          [
            'scale',
            'rect',
            'group',
            'gline',
            'pgraphics',
            'pcontainer',
            'ptext',
          ].includes(el),
      },
    },
  });
}
