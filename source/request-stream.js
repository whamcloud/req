// @flow

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

import { PassThrough } from 'stream';
import ResponseError from './response-error.js';

import type { TransportModules } from './index.js';
import type { Agent } from 'http';
import type { Options } from './build-options.js';

class RequestStream extends PassThrough {
  constructor(opts?: Object) {
    super(opts);
  }
  responseHeaders: {
    [key: string]: string
  };
  statusCode: number;
  abort: () => void;
}

export default (transport: TransportModules, agent: Agent) => (
  options: Options,
  buffer?: Buffer
) => {
  const requestOptions = {
    ...options,
    agent
  };

  const s = new RequestStream();

  const req = transport.request(requestOptions, r => {
    r.on('error', handleError);

    if (r.statusCode >= 400) handleError(new ResponseError(r.statusCode), true);

    s.responseHeaders = r.headers;
    s.statusCode = r.statusCode;
    r.pipe(s);
  });

  if (buffer) {
    req.setHeader('Content-Length', buffer.length.toString());
    req.setHeader('Transfer-Encoding', 'identity');
    req.write(buffer);
  }

  s.abort = req.abort.bind(req);

  req.on('error', handleError);
  req.end();

  return s;

  function handleError(err, keepOpen) {
    s.emit('error', err);
    if (!keepOpen) s.end();
  }
};
