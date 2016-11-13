const fs = require('fs'),
    path = require('path'),
    google = require('googleapis'),
    glob = require('glob'),
    mkdirp = require('mkdirp'),
    WRITE_OPTS = { encoding: 'utf8' },
    sheets = google.sheets('v4');

const EXT_TYPES = {
  json: '.lang.json',
  module: '.lang.js',
};

function transformBundle(ext, serializer, output, locale, bundles) {
  return Object.keys(bundles).map(function (bName) {
    const bundlePath = `${ output }/${ locale }/${ bName }${ ext }`;
    const bundle = bundles[bName];
    const data = serializer(bundle) + '\n';
    return writeFile(bundlePath, data).then(function () {
      return Promise.resolve({
        bName: bName,
        output: bundlePath,
      });
    }, function (err) {
      return Promise.reject(err);
    });
  });
}

function transformLocaleBundles(extension, serializer, output, locales, localeBundles) {
  return [].concat.apply([], (locales || []).map(function (locale) {
    const bundles = localeBundles[locale];
    return transformBundle(extension, serializer, output, locale, bundles);
  }));
}

function parseAsArray(arr, split) {
  if (typeof arr === 'string') {
    return arr.split(split || ',');
  }
  return arr;
}

const WRITE_SERIIALIZER = {
  json: function (bundle) {
    return JSON.stringify(bundle, null, 2);
  },
  module: function (bundle) {
    const bundleData = JSON.stringify(bundle);
    const date = new Date().toJSON();
    return `/** Bundle on ${ date } */\nmodule.exports = ${ bundleData };`;
  },
};

const WRITE_BUNDLE = {
  json: transformLocaleBundles.bind(this, EXT_TYPES.json, WRITE_SERIIALIZER.json),
  module: transformLocaleBundles.bind(this, EXT_TYPES.module, WRITE_SERIIALIZER.module),
};

function parseJson(filepath, cb) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filepath, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

function readServiceKey(key) {
  if (typeof key === 'object') {
    return Promise.resolve(key);
  }
  return parseJson(key);
}

function authorize(serviceKeyPath, scopes) {
  if (!serviceKeyPath || !scopes) {
    return Promise.reject('auth params do not exist');
  }
  return readServiceKey(serviceKeyPath).then(function (serviceKey) {
    const jwtClient = new google.auth.JWT(serviceKey.client_email, null, serviceKey.private_key, scopes, null);
    return new Promise(function (resolve, reject) {
      jwtClient.authorize(function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(jwtClient);
        }
      });
    });
  });
}

function readSheet(jwtClient, spreadsheetId, range) {
  return new Promise(function (resolve, reject) {
    sheets.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: spreadsheetId,
      range: range,
    }, function(err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

function parseRows(locales, values) {
  const bundles = {};
  const localeColumnIndexes = {};
  const validLocales = locales || [];
  validLocales.forEach(function (locale) {
    // setup locales whitelist
    localeColumnIndexes[locale] = -1;
  });
  (values || []).forEach(function (sheetRow, rowIndex) {
    const row = (sheetRow || []);
    if (rowIndex === 0) {
      row.forEach(function (locale, columnIndex) {
        // only accept valid locales
        if (localeColumnIndexes[locale]) {
          localeColumnIndexes[locale] = columnIndex;
        }
      });
    } else {
      const bName = row[0];
      const bKey = row[1];
      if (bName && bKey) {
        validLocales.forEach(function (locale) {
          const columnIndex = localeColumnIndexes[locale];
          if (!bundles[locale]) {
            bundles[locale] = {};
          }
          if (!bundles[locale][bName]) {
            bundles[locale][bName] = {};
          }
          bundles[locale][bName][bKey] = row[columnIndex];
        });
      }
    }
  });
  return bundles;
}

function downloadBundles(serviceKey, spreadsheetId, sheetname, range, output, type, locales) {
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
  ];
  console.log(`authorizing access to ${ spreadsheetId }`);
  authorize(serviceKey, scopes).then(function (authClient) {
    console.log(`reading ${ spreadsheetId }`);
    readSheet(authClient, spreadsheetId, `${ sheetname }!${ range }`).then(function (response) {
      console.log(`writing bundles to ${ output }`);
      const bundles = parseRows(locales, response.values);
      return Promise.all(WRITE_BUNDLE[type](output, locales, bundles)).then(function (files) {
        (files || []).forEach(function (o) {
          console.log('wrote ', o.bName, ' - ', o.output);
        });
        console.log('Finished importing')
      }, function (err) {
        console.log('write error', err);
      });
    }, function (err) {
      console.error('Read error', err);
    });
  }, function (err) {
    console.error('Authentication error', err);
  });
}

function createBundleRows(bName, bundle) {
  const bundles = {};
  bundles[bName] = Object.keys(bundle).sort().map(function (bKey) {
    return [bName, bKey, bundle[bKey]];
  });
  return bundles;
}

function createFileTransform(cb) {
  return function (basepath, ext, filepath) {
    return new Promise(function(resolve, reject) {
      cb(`${ basepath }/${ filepath }`, resolve, reject);
    }).then(function (bundle) {
      const locale = path.dirname(filepath);
      const bName = path.basename(filepath, ext);
      return Promise.resolve([locale, bName, bundle]);
    }, function (err) {
      return Promise.reject(err);
    });
  }
}

const FILE_TRANSFORMS = {
  'json': createFileTransform(function (filepath, resolve, reject) {
    fs.readFile(filepath, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  }),
  'module': createFileTransform(function (filepath, resolve, reject) {
    try {
      const data = require(filepath);
      resolve(data);
    } catch (e) {
      reject(e);
    }
  }),
};

function mergeArrays(arr1, arr2) {
  return [].concat.apply(arr1, arr2);
}

function convertRow(arr) {
  const rowData = (arr || []).map(function (item) {
    return JSON.stringify(item);
  }).join(',') + '\n';
  return rowData;
}

function globLocaleBundles(locales, basepath, transform) {
  const localesRegex = new RegExp(`${ locales.join('|') }/`);
  const ext = EXT_TYPES[transform];
  if (!FILE_TRANSFORMS[transform]) {
    return reject('transform not defined');
  }
  return new Promise(function (resolve, reject) {
    try {
      glob(`**/*${ ext }`, {
        cwd: basepath,
      }, function (err, files) {
        if (err) {
          reject(err);
        } else  {
          resolve((files || []).filter(function (file) {
            return localesRegex.test(file);
          }));
        }
      });
    } catch(e) {
      reject(e);
    }
  });
}

function readLocaleBundles(locales, basepath, transform) {
  return new Promise(function (resolve, reject) {
    globLocaleBundles(locales, basepath, transform).then(function(files) {
      const myTransform = FILE_TRANSFORMS[transform].bind(this, basepath, ext);
      Promise.all(files.map(myTransform)).then(function (rows) {
        const csvMap = {};

        (rows || []).forEach(function (row) {
          const locale = row[0];
          const bName = row[1];
          const bundle = row[2];

          Object.keys(bundle).forEach(function (bKey) {
            const bMsg = bundle[bKey];
            if (!csvMap[`${ bName }.${ bKey }`]) {
              csvMap[`${ bName }.${ bKey }`] = {};
              csvMap[`${ bName }.${ bKey }`]._meta = {
                bName: bName,
                bKey: bKey,
              };
            }
            csvMap[`${ bName }.${ bKey }`][locale] = bMsg;
          });
        });

        const csv = Object.keys(csvMap).sort().map(function (mapKey) {
          const row = csvMap[mapKey];
          return convertRow(mergeArrays([row._meta.bName, row._meta.bKey], locales.map(function (locale) {
            return row[locale];
          })));
        }).join('');
        resolve(convertRow(mergeArrays(['bundle', 'key'], locales)) + csv);
      }, function (err) {
        reject(err);
      });
    }, function (err) {
      reject(err);
    });
  });
}

function writeSheet(authClient, spreadsheetId, range, rows) {
  return new Promise(function (resolve, reject) {
    const sheets = google.sheets('v4');
    sheets.spreadsheets.values.append({
      auth: authClient,
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
    }, {
      body: {
        range: range,
        majorDimension: 'ROWS',
        values: rows,
      }
    },
    function(err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

function writeFile(output, data) {
  return new Promise(function (resolve, reject) {
    const basepath = path.dirname(output);
    mkdirp(basepath, function (err) {
      if (err) {
        reject(err);
      } else {
        fs.writeFile(output, data, WRITE_OPTS, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  });
}

function generateCSV(path, transform, output, locales) {
  readLocaleBundles(locales, path, transform).then(function (data) {
    writeFile(output, data).then(function () {
      console.log('Finished writing CSV\n', output, '\n');
    }, function (err) {
      console.error(err);
    });
  }, function (err) {
    console.error('Error reading bundles', err);
  });
}

function clearFilterViews(authClient, spreadsheetId, sheet, callback) {
  console.log(`[${ sheet.properties.title }] Clearing old filter views`);
  sheets.spreadsheets.batchUpdate({
    auth: authClient,
    spreadsheetId: spreadsheetId,
    resource: {
      "requests": sheet.filterViews.map(function (filter) {
        return {
          deleteFilterView: {
            filterId: filter.filterViewId
          },
        };
      }),
    },
  }, function (err, response) {
    if (err){
      console.log(err);
      return;
    }
    console.log(`[${ sheet.properties.title }] Cleared old filter views`);
    callback(response);
  });
}

function createFilterViews(authClient, spreadsheetId, sheet, bundleNames, callback) {
  console.log(`[${ sheet.properties.title }] Adding new filter views`);
  sheets.spreadsheets.batchUpdate({
    auth: authClient,
    spreadsheetId: spreadsheetId,
    resource: {
      "requests": bundleNames.map(function (bundleName, index) {
        return {
          addFilterView: {
            filter: {
              title: bundleName,
              range: {
                sheetId: sheet.properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1000,
                startColumnIndex: 0,
                endColumnIndex: 24,
              },
              criteria: {
                "0": {
                  "condition": {
                    "type": "TEXT_EQ",
                    "values": [
                      {
                        "userEnteredValue": bundleName,
                      }
                    ]
                  }
                }
              }
            },
          },
        };
      }),
    },
  }, function (err, response) {
    if (err){
      console.log(err);
      return;
    }
    console.log(`[${ sheet.properties.title }] Added new filter views`);
    callback(response);
  });
}

function generateFilterViews(serviceKey, spreadsheetId, sheetname, range, path, transform, locales) {
  globLocaleBundles(locales, path, transform).then(function (files) {
    var bundleName = /[^/]+\/([^/.]+).+/i;
    var bundleNames = files.map(function (file) {
      var match = bundleName.exec(file);
      return match.pop();
    }).sort();

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
    ];
    authorize(serviceKey, scopes).then(function (authClient) {
      sheets.spreadsheets.get({
        auth: authClient,
        spreadsheetId: spreadsheetId,
      }, function(err, spreadsheet) {
        var sheet = spreadsheet.sheets.filter(function (sheet) {
          return sheet.properties.title === sheetname;
        })[0];

        function createHandler(response) {
          console.log(`[${ sheet.properties.title }] Finished generating filterviews`);
        }

        if (sheet.filterViews && sheet.filterViews.length) {
          clearFilterViews(authClient, spreadsheetId, sheet, function (err) {
            createFilterViews(authClient, spreadsheetId, sheet, bundleNames, createHandler);
          });
        } else {
          createFilterViews(authClient, spreadsheetId, sheet, bundleNames, createHandler);
        }
      });
    });
  }, function (err) {
    console.log(err);
  });
}

module.exports = {
  generateCSV: generateCSV,
  downloadBundles: downloadBundles,
  generateFilterViews: generateFilterViews,
  parseJson: parseJson,
  parseAsArray: parseAsArray,
};
