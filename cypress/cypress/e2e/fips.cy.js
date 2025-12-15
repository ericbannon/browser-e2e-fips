// cypress/e2e/fips.cy.js

describe('FIPS and TLS Status Checks', () => {
  it('prints Node/OpenSSL FIPS status', () => {
    // Runs in Node (defined in cypress.config.js -> setupNodeEvents)
    cy.task('printFipsStatus');
  });

  it('runs the system openssl-fips-test binary', () => {
    cy.task('opensslFipsTest').then((result) => {
      expect(result).to.have.property('success', true);
    });
  });

  it('verifies TLS protocol and cipher to the TLS proxy', () => {
    // This performs a real TLS handshake from the Cypress runner
    // to https://tls-proxy:8443 and prints:
    //   - negotiated TLS version
    //   - negotiated cipher suite
    // Fails the test if TLS policy is violated.
    cy.task('tlsCheck');
  });
});