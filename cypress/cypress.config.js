const { defineConfig } = require("cypress");
const { execSync } = require("child_process");
const crypto = require("crypto");
const https = require("https");
const { URL } = require("url");

module.exports = defineConfig({
  video: false,
  chromeWebSecurity: false,

  e2e: {
    // Default to the in-compose TLS proxy. Override with CYPRESS_baseUrl if needed.
    baseUrl: process.env.CYPRESS_baseUrl || "https://tls-proxy:8443",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",

    setupNodeEvents(on, config) {
      // Allow self-signed certs for browser automation (test-only)
      on("before:browser:launch", (browser = {}, launchOptions) => {
        if (browser.family === "chromium") {
          launchOptions.args.push("--ignore-certificate-errors");
          launchOptions.args.push("--allow-insecure-localhost");
        }
        // Firefox handling is more internal; leave it, but allow prefs if needed later.
        return launchOptions;
      });

      on("task", {
        // --- Task: print Node/OpenSSL FIPS status ---
        printFipsStatus() {
          console.log("\n===== Node/OpenSSL FIPS STATUS =====");
          try {
            console.log(`Node Version: ${process.version}`);
            console.log(`OpenSSL version: ${process.versions.openssl}`);
            const fips = crypto.getFips(); // 0 or 1
            console.log(`Node FIPS mode: ${fips}`);
          } catch (err) {
            console.error("Error determining FIPS status:", err.message);
          }
          console.log("===== END FIPS STATUS =====\n");
          return null;
        },

        // --- Task: run system openssl-fips-test ---
        opensslFipsTest() {
          console.log("===== Running openssl-fips-test (system FIPS self-test) =====");
          try {
            const output = execSync("openssl-fips-test", { encoding: "utf8" });
            console.log(output.trim());
            console.log("===== openssl-fips-test completed successfully ✅ =====");
            return { success: true, output };
          } catch (err) {
            console.error("===== openssl-fips-test FAILED ❌ =====");
            if (err.stdout) console.error("stdout:\n" + err.stdout.toString());
            if (err.stderr) console.error("stderr:\n" + err.stderr.toString());
            console.error("Error message:", err.message);
            return { success: false, error: err.message };
          }
        },

        // --- Task: TLS handshake check from Cypress runner -> baseUrl (prints protocol + cipher) ---
        async tlsCheck() {
          console.log("\n===== TLS CHECK (Cypress runner -> baseUrl) =====");

          const baseUrl = process.env.CYPRESS_baseUrl || config.baseUrl || "https://tls-proxy:8443";
          const u = new URL(baseUrl);

          if (u.protocol !== "https:") {
            throw new Error(`TLS check requires https:// baseUrl, got: ${baseUrl}`);
          }

          const host = u.hostname;
          const port = u.port ? Number(u.port) : 443;

          console.log(`Target: https://${host}:${port}`);

          // self-signed cert in test: allow handshake to complete
          const agent = new https.Agent({
            rejectUnauthorized: false,
            minVersion: "TLSv1.2",
          });

          const reqOptions = {
            host,
            port,
            path: "/",
            method: "GET",
            agent,
          };

          await new Promise((resolve, reject) => {
            const req = https.request(reqOptions, (res) => {
              const socket = res.socket;

              const protocol = socket.getProtocol?.() || "unknown";
              const cipher = socket.getCipher?.();

              console.log(`Negotiated protocol: ${protocol}`);
              if (cipher) {
                console.log(`Negotiated cipher: ${cipher.name}`);
                console.log(`Cipher version: ${cipher.version}`);
              } else {
                console.log("Negotiated cipher: unknown");
              }

              // Policy checks (tune if your assessor requires exact allowlist)
              const okProtocol = protocol === "TLSv1.2" || protocol === "TLSv1.3";
              const okCipher = !!cipher?.name && cipher.name.includes("GCM");

              if (!okProtocol) {
                return reject(new Error(`TLS policy failure: expected TLSv1.2+ but got ${protocol}`));
              }
              if (!okCipher) {
                return reject(
                  new Error(`TLS policy failure: expected AES-GCM cipher but got ${cipher?.name || "unknown"}`)
                );
              }

              console.log("TLS policy check: PASS ✅");
              console.log("===== END TLS CHECK =====\n");
              resolve();
            });

            req.on("error", reject);
            req.end();
          });

          return null;
        },
      });

      return config;
    },
  },
});