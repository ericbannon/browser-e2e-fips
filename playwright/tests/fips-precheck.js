// playwright/tests/fips-precheck.js
const crypto = require("crypto");
const { execSync } = require("child_process");

function section(title) {
  console.log(`\n===== ${title} =====`);
}

function main() {
  section("Node / OpenSSL FIPS STATUS");

  console.log(`Node Version           : ${process.version}`);
  console.log(`Node Platform          : ${process.platform} (${process.arch})`);
  console.log(`Linked OpenSSL Version : ${process.versions.openssl}`);
  console.log(`NODE_OPTIONS           : ${process.env.NODE_OPTIONS || "(not set)"}`);

  if (typeof crypto.getFips === "function") {
    const fips = crypto.getFips();
    console.log(`Node FIPS mode         : ${fips}`);

    if (fips !== 1) {
      throw new Error("Node FIPS mode is NOT enabled (expected 1).");
    }
  } else {
    console.log("crypto.getFips()       : not available on this Node build");
  }

  console.log("===== END Node / OpenSSL FIPS STATUS =====");

  section("OpenSSL FIPS Self-Test (openssl-fips-test)");

  try {
    const output = execSync("openssl-fips-test", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Print raw output verbatim — auditors like this
    console.log(output.trim());

    console.log("openssl-fips-test result: SUCCESS ✅");
  } catch (err) {
    console.error("openssl-fips-test result: FAILED ❌");

    if (err.stdout) {
      console.error("stdout:\n" + err.stdout.toString());
    }
    if (err.stderr) {
      console.error("stderr:\n" + err.stderr.toString());
    }

    throw err;
  }

  console.log("\n===== FIPS PRECHECK COMPLETED SUCCESSFULLY ✅ =====\n");
}

try {
  main();
} catch (e) {
  console.error("\n===== FIPS PRECHECK FAILED ❌ =====");
  console.error(e?.message || e);
  process.exit(1);
}