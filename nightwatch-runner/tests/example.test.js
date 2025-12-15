// nightwatch-runner/tests/example.test.js
module.exports = {
  'Google loads and title is correct': async function (browser) {
    await browser
      .url('https://www.google.com')
      .waitForElementVisible('body', 5000);

    const title = await browser.getTitle();
    console.log('Page title:', title);

    await browser.end();
  },
};