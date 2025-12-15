// nightwatch-runner/nightwatch.conf.js
const { execSync } = require('child_process');

module.exports = {
  src_folders: ['tests'],
  output_folder: 'tests_output',

  webdriver: {
    start_process: false,
    host: process.env.SELENIUM_HOST || 'selenium-router',
    port: Number(process.env.SELENIUM_PORT) || 4444,
  },

  test_settings: {
    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
        },
      },
    },

    firefox: {
      desiredCapabilities: {
        browserName: 'firefox',
        'moz:firefoxOptions': {
          args: ['-headless'],
        },
      },
    },
  },

  // FIPS verification using BouncyCastle inside the jdk-fips base image
  globals: {
    before(done) {
      try {
        console.log('==== BouncyCastle FIPS STATUS (DumpInfo) ====');
        const output = execSync('java org.bouncycastle.util.DumpInfo', {
          encoding: 'utf8',
        });
        console.log(output);
        console.log('=============================================');

        if (!output.includes('FIPS Ready Status: READY')) {
          return done(
            new Error(
              'BouncyCastle FIPS is NOT in READY state. See DumpInfo output above.'
            )
          );
        }

        console.log('BouncyCastle FIPS is READY ✅');
        return done();
      } catch (err) {
        console.error('FIPS verification via BouncyCastle DumpInfo failed ❌');
        console.error(err && err.message ? err.message : err);
        // Fail the whole run
        return done(err);
      }
    },
  },
};