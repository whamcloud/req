//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2016 Intel Corporation All Rights Reserved.
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

var obj = require('intel-obj');
var fp = require('intel-fp');
var jsonMask = require('./mask');
var bufferRequest = require('./buffer-request');
var format = require('util').format;

module.exports = fp.curry(3, function bufferJsonRequest (transport, agent, options) {
  options = obj.clone(options || {});

  var mask;
  if (typeof options.jsonMask === 'string') {
    mask = options.jsonMask;
    delete options.jsonMask;
  }

  var buffer;

  if (options.json) {
    buffer = new Buffer(JSON.stringify(options.json));

    obj.merge(options, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8'
      }
    });

    delete options.json;
  }

  var s = bufferRequest(transport, agent, options, buffer);

  var s2 = s
    .map(fp.over(
      fp.lensProp('body'),
      fp.flow(
        function convert (x) {
          try {
            return JSON.parse(x);
          } catch (e) {
            throw new Error(format('Could not parse %s to JSON.', x));
          }
        },
        jsonMask(mask)
      )
    ));

  s2.abort = s.abort;

  return s2;
});
