// cypress/support/commands.js
// Custom Cypress commands go here.
// For now this is just a placeholder to satisfy the import in e2e.js.

Cypress.Commands.add('logFipsContext', () => {
  cy.log('Running in JDK FIPS + Chainguard test environment');
});
