import resolveConfig from "tailwindcss/resolveConfig";

export const designConfig = resolveConfig({
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx,md}"],
  safelist: ["opacity-0", "opacity-100"],
  theme: {},
  plugins: [],
});

export default designConfig;
