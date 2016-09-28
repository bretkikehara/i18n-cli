#! /usr/bin/env node

var lib = require('./lib'),
    cfgPath = process.env.REACT_I18N || (process.cwd() + '/.i18nrc');

function cli(cfg) {
  var defaultPath = cfg.output || './tmp',
      bundleFormat = cfg.format || 'module';
  require('yargs')
    .usage('$0 <cmd> [args]')
    .demand(1)
    .command('bundles [serviceKey] [spreadsheetId] [range] [output]', 'Converts Google sheet rows to a i18n lang files.', {
      output: {
        demand: true,
        default: defaultPath,
      },
      spreadsheetId: {
        demand: true,
        default: cfg.spreadsheetId,
      },
      serviceKey: {
        demand: true,
        default: cfg.serviceKey,
      },
      range: {
        demand: true,
        default: cfg.range,
      },
      format: {
        default: bundleFormat,
      },
      locales: {
        demand: true,
        default: cfg.locales || 'en-US',
      }
    }, function (argv) {
      console.log('Downloading bundles from Google Sheets...');
      var locales = lib.parseAsArray(argv.locales);
      lib.downloadBundles(argv.serviceKey, argv.spreadsheetId, argv.range, argv.output, argv.format, locales);
    })
    .command('csv [ext] [format] [path]', 'Generates a CSV file that can be added to the Google Sheet.', {
      path: {
        demand: true,
        default: defaultPath,
      },
      format: {
        default: bundleFormat,
      },
      output: {
        default: defaultPath,
      },
      filename: {
        default: cfg.filename || 'i18n-' + (new Date().getTime()) + '.csv',
      },
      locales: {
        demand: true,
        default: cfg.locales || 'en-US',
      },
    }, function (argv) {
      console.log('Generating the CSV for upload to Google Sheets...');
      var locales = lib.parseAsArray(argv.locales);
      lib.generateCSV(argv.path, argv.format, argv.output + '/' + argv.filename, locales);
    })
    .help()
    .argv;
}

lib.parseJson(cfgPath).then(function (cfg) {
  cli(cfg);
}, function (err) {
  console.error('ERROR: runtime config file cannot be found!\n\n');
  cli({});
});
