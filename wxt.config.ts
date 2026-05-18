import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",
  vite: () => ({
    plugins: [tailwindcss()],
    server: {
      port: 3001,
      host: "127.0.0.1",
    },
  }),
  manifest: {
    action: {
      default_title: "LinkedIn++",
    },
    permissions: ["tabs", "contextMenus"],
  },
});
