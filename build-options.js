//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2015 Intel Corporation All Rights Reserved.
//
// The source code contained or described herein and all documents related
// to the source code ("Material") are owned by Intel Corporation or its
// suppliers or licensors. Title to the Material remains with Intel Corporation
// or its suppliers and licensors. The Material contains trade secrets and
// proprietary and confidential information of Intel or its suppliers and
// licensors. The Material is protected by worldwide copyright and trade secret
// laws and treaty provisions. No part of the Material may be used, copied,
// reproduced, modified, published, uploaded, posted, transmitted, distributed,
// or disclosed in any way without Intel's prior express written permission.
//
// No license under any patent, copyright, trade secret or other intellectual
// property right is granted to or conferred upon you by disclosure or delivery
// of the Materials, either expressly, by implication, inducement, estoppel or
// otherwise. Any license under such intellectual property rights must be
// express and approved by Intel in writing.

'use strict';

var stringify = require('querystring').stringify;
var format = require('util').format;
var obj = require('intel-obj');

var defaults = {
  method: 'GET',
  headers: {
    Connection: 'keep-alive',
    'Transfer-Encoding': 'chunked'
  },
  rejectUnauthorized: false
};

module.exports = function buildOptions (options) {
  options.path = options.path
    .replace(/^\/*/, '/')
    .replace(/\/*$/, '/');

  var queryString = stringify(options.qs);
  if (queryString)
    options.path = format('%s?%s', options.path, queryString);

  var opts = obj.merge({}, defaults, options);

  if (options.json)
    obj.merge(opts, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json'
      }
    });

  return opts;
};
