// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import jsonMask from './mask.js';
import bufferRequest from './buffer-request.js';

import type { Agent } from 'http';
import type { Response, AbortStream } from './buffer-request.js';
import type { InputOptions } from './build-options.js';
import type { TransportModules } from './index.js';

export type JsonResponse = {
  ...$Exact<Response>,
  +body: Object
};

export default (transport: TransportModules, agent: Agent) => (
  options: InputOptions
) => {
  let opts = {
    ...options
  };

  let mask;
  if (typeof opts.jsonMask === 'string') {
    mask = opts.jsonMask;
    delete opts.jsonMask;
  }

  let buffer;

  if (options.json) {
    buffer = new Buffer(JSON.stringify(options.json));

    opts = {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8'
      }
    };

    delete opts.json;
  }

  const s: AbortStream<Response> = bufferRequest(transport, agent)(
    opts,
    buffer
  );

  const s2 = s.map((x: Response): JsonResponse => {
    const masker = jsonMask(mask);
    try {
      const body: Object = masker(JSON.parse(x.body));

      return ({
        headers: x.headers,
        statusCode: x.statusCode,
        body
      }: JsonResponse);
    } catch (e) {
      throw new Error(`Could not parse ${x.body} to JSON.`);
    }
  });

  // $FlowFixMe Monkey patch highland type.
  s2.abort = s.abort;

  return ((s2: any): AbortStream<JsonResponse>);
};
