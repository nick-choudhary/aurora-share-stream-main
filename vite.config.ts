import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const plugins = [react()];

  // Allow overriding base via env (useful for GitHub Pages)
  // Example: VITE_BASE="/repo-name/"
  const base = process.env.VITE_BASE ?? "/";

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
