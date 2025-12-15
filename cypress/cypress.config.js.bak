const { defineConfig } = require("cypress");
const { execSync } = require("child_process");
const crypto = require("crypto");

module.exports = defineConfig({
  video: false,
  chromeWebSecurity: false,

  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "https://www.google.com",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",

    setupNodeEvents(on, config) {
      // --- Task: print Node/OpenSSL FIPS status ---
      on("task", {
        printFipsStatus() {
          console.log("\n===== Node/OpenSSL FIPS STATUS =====");

          try {
            console.log(`Node Version: ${process.version}`);
            console.log(`OpenSSL version: ${process.versions.openssl}`);

            // Node’s FIPS mode: 0 (off) or 1 (on)
            const fips = crypto.getFips();
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
            const output = execSync("openssl-fips-test", {
              encoding: "utf8",
            });

            // Print the raw result from the binary
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
        }
      });

      return config;
    }
  }
});