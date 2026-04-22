const path = require('path');

// Path to the built iOS .app bundle (update after running `expo run:ios`)
// For Simulator: ios-app/ios/build/Build/Products/Debug-iphonesimulator/MongoBulkEdit.app
const IOS_APP_PATH = path.resolve(
  __dirname,
  '../ios-app/ios/build/Build/Products/Debug-iphonesimulator/MongoBulkEdit.app'
);

exports.config = {
  runner: 'local',

  // ─── Appium service ─────────────────────────────────────────────────────────
  // Appium is started manually; no service needed
  services: [],

  port: 4723,

  // ─── iOS Capabilities ───────────────────────────────────────────────────────
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': 'iPhone 15',
      'appium:platformVersion': '17.5',
      'appium:app': IOS_APP_PATH,
      'appium:newCommandTimeout': 240,
      'appium:wdaLaunchTimeout': 120000,
      'appium:noReset': false,
    },
  ],

  // ─── Test files ──────────────────────────────────────────────────────────────
  specs: ['./tests/**/*.spec.js'],

  suites: {
    ios: ['./tests/**/*.spec.js'],
  },

  maxInstances: 1,

  // ─── Framework ───────────────────────────────────────────────────────────────
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },

  // ─── Reporters ───────────────────────────────────────────────────────────────
  reporters: [
    'spec',
    [
      'spec',
      {
        outputDir: './reports',
        outputFileFormat: (options) =>
          `results-${options.cid}.${options.capabilities.platformName}.xml`,
      },
    ],
  ],

  // ─── Hooks ───────────────────────────────────────────────────────────────────
  beforeSession(_config, _capabilities, _specs) {
    // Nothing extra needed
  },
  afterSession(_config, _capabilities, _specs) {
    // Nothing extra needed
  },
};
