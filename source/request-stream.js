// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

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
