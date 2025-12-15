// nightwatch-runner/nightwatch.conf.js
const { execSync } = require("child_process");

module.exports = {
  src_folders: ["tests"],
  output_folder: "tests_output",

  webdriver: {
    start_process: false,
    host: process.env.SELENIUM_HOST || "selenium-router",
    port: Number(process.env.SELENIUM_PORT) || 4444,
  },

  test_settings: {
    chrome: {
      launch_url: process.env.LAUNCH_URL || "https://tls-proxy:8443",
      desiredCapabilities: {
        browserName: "chrome",
        acceptInsecureCerts: true,
        "goog:chromeOptions": {
          args: [
            "--headless=new",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--ignore-certificate-errors",
            "--allow-insecure-localhost",
          ],
        },
      },
    },

    firefox: {
      launch_url: process.env.LAUNCH_URL || "https://tls-proxy:8443",
      desiredCapabilities: {
        browserName: "firefox",
        acceptInsecureCerts: true,
        "moz:firefoxOptions": {
          args: ["-headless"],
          prefs: {
            "network.stricttransportsecurity.preloadlist": false,
            "security.enterprise_roots.enabled": true,
            "webdriver_accept_untrusted_certs": true,
            "webdriver_assume_untrusted_issuer": false,
          },
        },
      },
    },
  },

  // FIPS verification (BC) + TLS verification (Java handshake to launch_url)
  globals: {
    before(done) {
      try {
        // --- 1) BouncyCastle FIPS status ---
        console.log("==== BouncyCastle FIPS STATUS (DumpInfo) ====");
        const dump = execSync("java org.bouncycastle.util.DumpInfo", {
          encoding: "utf8",
        });
        console.log(dump);
        console.log("=============================================");

        if (!dump.includes("FIPS Ready Status: READY")) {
          return done(
            new Error(
              "BouncyCastle FIPS is NOT in READY state. See DumpInfo output above."
            )
          );
        }
        console.log("BouncyCastle FIPS is READY ✅");

        // --- 2) TLS handshake check to proxy (prints negotiated TLS protocol + cipher) ---
        console.log("\n===== TLS CHECK (Nightwatch runner -> LAUNCH_URL) =====");

        const launchUrl = process.env.LAUNCH_URL || "https://tls-proxy:8443";
        console.log(`Target: ${launchUrl}`);

        const javaSrc = `
import javax.net.ssl.*;
import java.net.*;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

public class TLSCheck {
  public static void main(String[] args) throws Exception {
    URI u = new URI(args[0]);
    String host = u.getHost();
    int port = (u.getPort() != -1) ? u.getPort() : 443;

    TrustManager[] trustAll = new TrustManager[] {
      new X509TrustManager() {
        public void checkClientTrusted(X509Certificate[] c, String a) {}
        public void checkServerTrusted(X509Certificate[] c, String a) {}
        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
      }
    };

    SSLContext ctx = SSLContext.getInstance("TLS");
    ctx.init(null, trustAll, new SecureRandom());

    SSLSocketFactory sf = ctx.getSocketFactory();
    try (SSLSocket s = (SSLSocket) sf.createSocket(host, port)) {
      // Enforce TLS 1.2+ from the client side
      s.setEnabledProtocols(new String[] {"TLSv1.3", "TLSv1.2"});
      s.startHandshake();

      SSLSession sess = s.getSession();
      String proto = sess.getProtocol();
      String cipher = sess.getCipherSuite();

      System.out.println("Negotiated protocol: " + proto);
      System.out.println("Negotiated cipher: " + cipher);

      if (!("TLSv1.2".equals(proto) || "TLSv1.3".equals(proto))) {
        throw new RuntimeException("TLS policy failure: expected TLSv1.2+ but got " + proto);
      }
      if (!cipher.contains("_GCM_")) {
        throw new RuntimeException("TLS policy failure: expected GCM cipher but got " + cipher);
      }

      System.out.println("TLS policy check: PASS ✅");
    }
  }
}
`;

        execSync(
          `sh -lc 'cat > /tmp/TLSCheck.java <<\"EOF\"\n${javaSrc}\nEOF\njava /tmp/TLSCheck.java \"${launchUrl}\"'`,
          { stdio: "inherit", encoding: "utf8" }
        );

        console.log("===== END TLS CHECK =====\n");

        return done();
      } catch (err) {
        console.error("Pre-run verification failed ❌");
        return done(err);
      }
    },
  },
};