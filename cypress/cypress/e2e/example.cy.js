describe('Google loads', () => {
  it('shows the correct title', () => {
    cy.visit('/');
    cy.title().should('include', 'Google');
  });
});
