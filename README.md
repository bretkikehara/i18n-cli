i18n CLI
================================================

## Quickstart

1. npm install -g @bretkikehara/i18n-cli
2. Generate a [Google console service key](https://github.com/bretkikehara/i18n-cli/wiki/Generating-Service-Account-Credentials).
3. Enable the Google Sheets/Drive API.
4. Exec `i18n csv` with parameters to generate a CSV to upload into your localization source.
5. Editing your localization source.
6. Exec `i18n bundles` to create the individual localization bundles.
7. Ensure that the `react-i18n` module is imported inside your component.
8. Load you app to see the updates.

## Config file

All cli configs can be stored inside a `.i18nrc` JSON file. The cli will look at the present working directory for the `.i18nrc` file. This behavior can be overrided by setting the `REACT_I18N` environment.

```sh
$ REACT_I18N=/Users/me/.i18nrc i18n [command]
```

### Basic .i18nrc project
```js
{
  "serviceKey": "/Users/johndoe/.google/service-key-lang.json",
  "projects": {
    "project1": {
      "spreadsheetId": "google-sheet-id",
      "range": "sheet-name!A1:M1000",
      "output": "/Users/johndoe/project-name2/i18n-directory",
      "locales": [
        "en-US",
      ],
      "format": "module",
    }
  }
}
```

### Example of .i18nrc project override
```js
{
  "serviceKey": "/Users/johndoe/.google/service-key-lang.json",
  "spreadsheetId": "google-sheet-id",
  "output": "/Users/johndoe/project-name/i18n-directory",
  "locales": [
    "en-US",
    "fr-FR"
  ],
  "format": "module",
  "projects": {
  	// project that pulls from the global configs.
    "project1": {
      "range": "sheet-name!A1:M1000",
    },
  	// project that overrides the global configs.
    "project2": {
      "serviceKey": "/Users/johndoe/.google/override-service-key-lang.json",
      "spreadsheetId": "override-google-sheet-id",
      "range": "override-sheet-name!A1:M1000",
      "output": "/Users/johndoe/project-name2/i18n-directory/override",
      "locales": [
        "jp-JP",
      ],
      "format": "json",
    }
  }
}
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
- [ ] Configure multiple projects using 1 Google service account.
- [ ] Import existing i18n modules or JSON files into Google Sheets
