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
      defaultPath = cfg.output || './tmp',
      defaultSpreadsheetId = cfg.spreadsheetId,
      defaultRange = cfg.range,
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
          range = project.range || defaultRange,
          output = project.output || defaultPath,
          format = project.format || defaultFormat,
          locales = lib.parseAsArray(project.locales || defaultLocales);
      lib.downloadBundles(serviceKey, spreadsheetId, range, output, format, locales);
    })
    .command('csv <project>', 'Generates a CSV file that can be added to the Google Sheet.', {}, function (argv) {
      var project = getProject(cfg, argv.project),
          path = project.output || defaultPath,
          format = project.format || defaultFormat,
          output = project.output || defaultOutput,
          filename = project.filename || defaultFilename,
          locales = lib.parseAsArray(project.locales || defaultLocales);

      console.log('Generating the CSV for upload to Google Sheets...');
      lib.generateCSV(path, format, output + '/' + filename, locales);
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
