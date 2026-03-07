import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // jsdom is required for React Testing Library and user-event
    globals: true,
    server: {
      deps: {
        inline: ["C:"]
      }
    }
  }
});
