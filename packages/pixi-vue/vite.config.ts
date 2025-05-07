import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import dts from "vite-plugin-dts";
import auto from "autoprefixer";
import tailwind from "tailwindcss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("g-"),
        },
      },
    }),
    dts({ rollupTypes: true }) as any,
  ],
  build: {
    minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: path.resolve(__dirname, "src/lib.ts"),
      name: "pixi-vue",
      formats: ["es"],
      fileName: "pixi-vue",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue", "pixi.js"],
    },
  },
  css: { postcss: { plugins: [auto(), tailwind()] } },
  esbuild: {
    target: "es2022",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
});
