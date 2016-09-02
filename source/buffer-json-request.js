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

import jsonMask from './mask.js';
import bufferRequest from './buffer-request.js';

import type { Agent } from 'http';
import type { Response, AbortStream } from './buffer-request.js';
import type { InputOptions } from './build-options.js';
import type { TransportModules } from './index.js';

type JsonResponse = {
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
