import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // or 'jsdom' if DOM is needed
    globals: true,
    server: {
      deps: {
        inline: ["C:"]
      }
    }
  }
});
