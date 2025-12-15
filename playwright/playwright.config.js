// playwright/playwright.config.js
const { defineConfig } = require("@playwright/test");
const fs = require("fs");

const baseURL = process.env.PW_BASE_URL || "https://tls-proxy:8443";

function findChromiumExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }

  // If undefined, Playwright will try its downloaded browser cache (ms-playwright)
  return undefined;
}

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  reporter: [["list"]],

  use: {
    baseURL,
    headless: true,

    // Self-signed TLS proxy cert
    ignoreHTTPSErrors: true,

    // Helpful in Docker
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath: findChromiumExecutable(),
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--ignore-certificate-errors",
            "--allow-insecure-localhost",
          ],
        },
      },
    },
  ],
});