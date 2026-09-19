import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
        login: resolve(__dirname, "login.html"),
        orders: resolve(__dirname, "orders.html"),
        profile: resolve(__dirname, "profile.html"),
        catering: resolve(__dirname, "catering.html"),
        delivery: resolve(__dirname, "delivery.html"),
        about: resolve(__dirname, "about.html"),
        pg: resolve(__dirname, "pg.html"),
        qr: resolve(__dirname, "qr.html"),
        menu: resolve(__dirname, "menu.html"),
        order: resolve(__dirname, "order.html"),
      },
    },
  },
});
