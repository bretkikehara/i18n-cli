i18n CLI
================================================

## Quickstart: Create Spreadsheet

1. Install the i18n cli tool.
  * `npm install -g @bretkikehara/i18n-cli`
2. Generate a [Google console service key](https://github.com/bretkikehara/i18n-cli/wiki/Generating-Service-Account-Credentials).
3. Enable the Google Sheets or Google Drive APIs.
4. Create a [project config file](https://github.com/bretkikehara/i18n-cli#config-file).
5. On the command line, generate an uploadable CSV.
  * `i18n csv <project>`
6. Create a Google Sheet that will can be shared.
7. Import the CSV into the Google Sheet.

Now the spreadsheet should be ready to generate bundle files.

## Quickstart: Generate Localization Bundles

1. Ensure the <project>'s' `sheetname` config is the same name as the Google Spreadsheet sheet name.
2. Ensure config `path` points to your app's localization directory.
3. Exec `i18n bundles <project>` to create the <project>'s' localization bundles.
4. Ensure that the `react-i18n` module is imported inside your component.
5. Load you app to see the updates.

## Config file

All cli configs can be stored inside a `.i18nrc` JSON file. The cli will look at the present working directory for the `.i18nrc` file. This behavior can be overrided by setting the `REACT_I18N` environment.

```sh
$ REACT_I18N=/Users/me/.i18nrc i18n [command]
```

### Basic .i18nrc project
```js
module.exports = (function(env) {
  return {
    "serviceKey": env.I18N_KEY || `${ env.HOME }/.google/service-key-lang.json`,
    "projects": {
      "project1": {
        "spreadsheetId": "google-sheet-id",
        "range": "sheet-name!A1:M1000",
        "output": `${ env.HOME }/project-name2/i18n-directory`,
        "locales": [
          "en-US",
        ],
        "format": "module",
      }
    }
  };
})(process.env);
```

### Example of .i18nrc multi-projects with overrides
```js
module.exports = (function(env) {
  return {
    "serviceKey": env.I18N_KEY || `${ env.HOME }/.google/service-key-lang.json`,
    "spreadsheetId": "google-sheet-id",
    "output": `${ env.HOME }/project-name/i18n-directory`,
    "locales": [
      "en-US",
      "fr-FR"
    ],
    "format": "module",
    "projects": {
     // project that pulls from the global configs.
      "project1": {
        "sheetname": "sheet-name",
        "range": "A1:M1000",
      },
     // project that overrides the global configs.
      "project2": {
        "serviceKey": `${ env.HOME }/.google/override-service-key-lang.json`,
        "spreadsheetId": "override-google-sheet-id",
        "sheetname": "sheet-name-2",
        "output": `${ env.HOME }/project-name2/i18n-directory/override`,
        "locales": [
          "jp-JP",
        ],
        "format": "json",
      }
    }
  };
})(process.env);
```

## Command: **bundles**

This command will generate the i18n compatible bundle files. Converts the Google sheets rows into a `json` or es5 `module` format for you app's consumption.

```sh
$ i18n bundles project2
```

## Command: **csv**

This command will generate a CSV from compatible bundle files. This CSV can be appended to a localization spreadsheet for later consumption using the `bundles` command.

```sh
$ i18n csv project2
```

## Roadmap
- [x] Create a CSV from existing i18n modules or JSON files
- [x] Download bundles from Google Sheets
- [x] Configure CLI using `.i18nrc` file
- [x] Configure multiple projects using 1 Google service account.
- [ ] Import existing i18n modules or JSON files into Google Sheets
