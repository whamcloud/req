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

var bufferRequest = require('./buffer-request');
var waitForRequests = require('./wait-for-requests');
var bufferJsonRequest = require('./buffer-json-request');

var transports = {
  http: require('http'),
  https: require('https')
};

module.exports = function getReq (transport, agent) {
  transport = transport || 'https';
  var t = transports[transport];

  agent = agent || new t.Agent({
    keepAlive: true,
    maxSockets: Infinity, // Just for Node 0.10,
    rejectUnauthorized: false // Just for Node 0.10
  });

  return {
    bufferJsonRequest: bufferJsonRequest(t, agent),
    bufferRequest: bufferRequest(t, agent),
    waitForRequests: waitForRequests(agent)
  };
};
