import { defineConfig, devices } from "@playwright/test";

const shared = {
  ...devices["Desktop Chrome"],
  viewport: { width: 1440, height: 960 },
  permissions: ["clipboard-read", "clipboard-write"],
  screenshot: "only-on-failure" as const,
  trace: "retain-on-failure" as const,
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    {
      name: "local",
      testMatch: "frontend*.spec.ts",
      use: { ...shared, baseURL: "http://127.0.0.1:3100" },
    },
    {
      name: "remote",
      testMatch: "remote*.spec.ts",
      use: { ...shared, baseURL: "http://127.0.0.1:3101" },
    },
  ],
  webServer: [
    {
      command: "npm run start -- --port 3100",
      url: "http://127.0.0.1:3100/inbox",
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        // Force local browser-storage mode regardless of what the developer's
        // .env.local configures (Supabase, workspace auth, etc.).
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
        WORKSPACE_PASSWORD: "",
        PROMPT_STASH_API_KEY: "",
      },
    },
    {
      // Remote mode against the on-disk server store (no Supabase needed for CI).
      command: "npm run start -- --port 3101",
      url: "http://127.0.0.1:3101/inbox",
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ENABLE_SERVER_API: "true",
        LOCAL_DATA_FILE: ".data/e2e-remote.json",
        SEED_DEMO_DATA: "false",
        SUPABASE_URL: "",
        SUPABASE_SERVICE_ROLE_KEY: "",
        WORKSPACE_PASSWORD: "",
        PROMPT_STASH_API_KEY: "",
      },
    },
  ],
});
