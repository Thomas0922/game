import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // 讓同一個區網的另一台電腦也連得進來
    host: true,
    port: 5173,
  },
});
