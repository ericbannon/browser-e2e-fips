const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

async function tlsCheck() {
  console.log('\n===== Playwright TLS CHECK (runner -> PW_BASE_URL) =====');

  const target = process.env.PW_BASE_URL || 'https://tls-proxy:8443';
  const u = new URL(target);

  const host = u.hostname;
  const port = u.port ? Number(u.port) : 443;

  console.log(`Target: https://${host}:${port}`);
  console.log(`Node Version: ${process.version}`);
  console.log(`OpenSSL version: ${process.versions.openssl}`);
  console.log(`Node FIPS mode: ${crypto.getFips?.()}`);

  const agent = new https.Agent({
    rejectUnauthorized: false, // self-signed test cert
    minVersion: 'TLSv1.2',
  });

  await new Promise((resolve, reject) => {
    const req = https.request(
      { host, port, path: '/', method: 'GET', agent },
      (res) => {
        const socket = res.socket;

        const protocol = socket.getProtocol?.() || 'unknown';
        const cipher = socket.getCipher?.();

        console.log(`Negotiated protocol: ${protocol}`);
        if (cipher) {
          console.log(`Negotiated cipher: ${cipher.name}`);
          console.log(`Cipher version: ${cipher.version}`);
        }

        const okProtocol = protocol === 'TLSv1.2' || protocol === 'TLSv1.3';
        const okCipher = !!cipher?.name && cipher.name.includes('GCM');

        if (!okProtocol) return reject(new Error(`TLS policy failure: expected TLSv1.2+ but got ${protocol}`));
        if (!okCipher) return reject(new Error(`TLS policy failure: expected GCM cipher but got ${cipher?.name || 'unknown'}`));

        console.log('TLS policy check: PASS ✅');
        console.log('===== END TLS CHECK =====\n');
        resolve();
      }
    );

    req.on('error', reject);
    req.end();
  });
}

tlsCheck().catch((e) => {
  console.error(e);
  process.exit(1);
});
