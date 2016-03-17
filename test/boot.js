'use strict';

require('jasmine-n-matchers');

if (process.env.RUNNER === 'CI') {
  var jasmineJUnitReporter = require('intel-jasmine-junit-reporter');

  var junitReporter = jasmineJUnitReporter({
    JUnitReportFilePrefix: process.env.FILE_PREFIX || 'req-results-' +  process.version,
    JUnitReportPackageName: 'Req Reports',
    JUnitReportSavePath: process.env.SAVE_PATH || './',
    JUnitReportSuiteName: 'Req Reports',
    specTimer: new jasmine.Timer()
  });

  jasmine.getEnv().addReporter(junitReporter);
}
