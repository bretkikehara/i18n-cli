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

All cli configs can be stored inside a `.i18nrc` JSON file. The cli will look at the present working directory for the `.i18n` file. This behavior can be overrided by setting the `REACT_I18N` environment.

```sh
$ REACT_I18N=/Users/me/.i18nrc i18n [command]
```

## Command: **bundles**

This command will generate the i18n compatible bundle files. Converts the Google sheets rows into a `json` or es5 `module` format for you app's consumption.

* output
	Output path for the bundles.
* spreadsheetId
	The Google Sheet spreadsheet ID.
* serviceKey
	The Google service account's service key.
* range
	The range that should be downloaded from Google sheets.
* format
	Defines either a `json` or `module` export type.
* locales
	An array or comma delimited list of locales such as `en-US` or `fr-FR`.

## Command: **csv**

This command will generate a CSV from compatible bundle files. This CSV can be appended to a localization spreadsheet for later consumption using the `bundles` command.

* path
	The path to the bundles.
* format
	Defines either a `json` or `module` export type.
* output
	Output path for the csv.
* locales
	An array or comma delimited list of locales such as `en-US` or `fr-FR`.

## Roadmap
- [x] Create a CSV from existing i18n modules or JSON files
- [x] Download bundles from Google Sheets
- [x] Configure CLI using `.i18nrc` file
- [ ] Import existing i18n modules or JSON files into Google Sheets
