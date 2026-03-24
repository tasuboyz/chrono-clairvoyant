import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Add your custom playwright configuration overrides here
  // Example:
  // timeout: 60000,
  use: {
    baseURL: "http://localhost:8080",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
