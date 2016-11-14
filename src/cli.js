#! /usr/bin/env node

var lib = require('./lib'),
    cfgPath = process.env.REACT_I18N || (process.cwd() + '/.i18nrc');

function getProject(cfg, name) {
  if (cfg.projects && name && cfg.projects[name]) {
    return cfg.projects[name];
  }
  return {};
}

function cli(cfg) {
  var defaultServiceKey = cfg.serviceKey,
      defaultOutput = cfg.output || './tmp',
      defaultPath = cfg.path || defaultOutput,
      defaultSpreadsheetId = cfg.spreadsheetId,
      defaultRange = cfg.range || 'A1:M1000',
      defaultLocales = cfg.locales || [ 'en-US' ],
      defaultFilename = cfg.filename || 'i18n-' + (new Date().getTime()) + '.csv',
      defaultFormat = cfg.format || 'module';
  require('yargs')
    .usage('$0 <cmd> [args]')
    .demand(1)
    .command('bundles <project>', 'Converts Google sheet rows to a i18n lang files.', {}, function (argv) {
      console.log('Downloading bundles from Google Sheets...');
      var project = getProject(cfg, argv.project),
          serviceKey = project.serviceKey || defaultServiceKey,
          spreadsheetId = project.spreadsheetId || defaultSpreadsheetId,
          sheetname = project.sheetname || argv.project,
          range = project.range || defaultRange,
          path = project.path || defaultPath,
          format = project.format || defaultFormat,
          locales = lib.parseAsArray(project.locales || defaultLocales);
      lib.downloadBundles(serviceKey, spreadsheetId, sheetname, range, path, format, locales);
    })
    .command('csv <project>', 'Generates a CSV file that can be added to the Google Sheet.', {}, function (argv) {
      var project = getProject(cfg, argv.project),
          path = project.output || defaultPath,
          format = project.format || defaultFormat,
          sheetname = project.sheetname || argv.project,
          output = project.output || defaultOutput,
          filename = project.filename || defaultFilename,
          locales = lib.parseAsArray(project.locales || defaultLocales);

      console.log('Generating the CSV for upload to Google Sheets...');
      lib.generateCSV(sheetname, path, format, output + '/' + filename, locales);
    })
    .command('filterviews <project>', 'Adds the filters views to the Google Sheet', {}, function (argv) {
      var project = getProject(cfg, argv.project),
          path = project.path || defaultPath,
          serviceKey = project.serviceKey || defaultServiceKey,
          spreadsheetId = project.spreadsheetId || defaultSpreadsheetId,
          sheetname = project.sheetname || argv.project,
          range = project.range || defaultRange,
          format = project.format || defaultFormat,
          locales = lib.parseAsArray(project.locales || defaultLocales);

      console.log('Update the filterview on the Google Sheet...');
      lib.generateFilterViews(serviceKey, spreadsheetId, sheetname, range, path, format, locales);
    })
    .help()
    .argv;
}

function readConfig(cfgPath) {
  return new Promise(function (resolve, reject) {
    var cfg;
    try {
      cfg = require(cfgPath);
      resolve(cfg);
    } catch(e) {
      reject(e);
    }
  });
}

readConfig(cfgPath).then(function (cfg) {
  cli(cfg);
}, function (err) {
  console.error('ERROR: runtime config file cannot be found!\n\n');
  cli({});
});
