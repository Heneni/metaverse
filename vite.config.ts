import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  base: "./", // switched to relative for Vercel + local asset paths
  build: {
    outDir: "dist"
  },
  server: {
    host: true
  }
});
