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

var obj = require('@intel-js/obj');
var λ = require('highland');
var fp = require('@intel-js/fp');
var requestStream = require('./request-stream');
var errorBuffer = require('./error-buffer');
var addRequestInfo = require('./add-request-info');
var buildOptions = require('./build-options');
var jsonMask = require('./mask');
var through = require('@intel-js/through');

module.exports = fp.curry(3, function bufferRequest (transport, agent, options) {
  options = obj.clone(options || {});

  var mask;
  if (typeof options.jsonMask === 'string') {
    mask = options.jsonMask;
    delete options.jsonMask;
  }

  var reqOptions = buildOptions(options);

  var buffer;

  if (options.json)
    buffer = new Buffer(JSON.stringify(options.json));

  var resp = {
    body: null
  };

  var s = requestStream(transport, agent, reqOptions, buffer);
  return λ(s)
    .through(errorBuffer)
    .through(through.bufferString)
    .through(through.toJson)
    .through(jsonMask(mask))
    .consume(function buildResp (err, body, push, next) {
      if (err) {
        push(err);
        next();
      } else if (body === nil) {
        resp.headers = s.responseHeaders;
        resp.statusCode = s.statusCode;
        push(null, resp);
        push(null, nil);
      } else {
        resp.body = body;
        next();
      }
    })
    .errors(addRequestInfo(reqOptions));
});
