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

import highland from 'highland';
import requestStream from './request-stream.js';
import errorBuffer from './error-buffer.js';
import addRequestInfo from './add-request-info.js';
import buildOptions from './build-options.js';
import ResponseError from './response-error.js';

import type { Agent } from 'http';
import type { PassThrough } from 'stream';
import type { HighlandStreamT } from 'highland';
import type { TransportModules } from './index.js';
import type { InputOptions } from './build-options.js';

export type Response = {
  body: string,
  +headers: {
    [key: string]: string,
    'set-cookie': string[]
  },
  +statusCode: number
};

export interface AbortStream<T> extends HighlandStreamT<T> {
  abort: () => void,
  stopOnError(fn: (err: ResponseError) => any): AbortStream<T>
}

export default (transport: TransportModules, agent: Agent) => (
  options: InputOptions,
  buffer?: Buffer
): AbortStream<Response> => {
  const opts = buildOptions(options || {});

  const resp = {};

  let gotError = false;

  const s = requestStream(transport, agent)(opts, buffer);

  function onFinish(req: PassThrough, callback: Function) {
    function StreamError(err: Error) {
      this.__HighlandStreamError__ = true;
      this.error = err;
    }

    req.on('end', callback).on('close', callback).on('error', err => {
      // $FlowFixMe hack, not worth typing
      s2._generator.source.write(new StreamError(err));
    });

    return () => {
      req.removeListener('end', callback);
      req.removeListener('close', callback);
      req.removeListener('error', callback);
    };
  }

  const s2: HighlandStreamT<Buffer> = highland(s, onFinish);

  const s3 = s2
    .through(errorBuffer)
    .map(x => x.toString('utf-8'))
    .collect()
    .map((xs: string[]) => xs.join(''))
    .consume((err, body: string, push, next) => {
      if (err) {
        gotError = true;
        push(err);
        next();
      } else if (body === highland.nil) {
        if (!gotError) {
          resp.headers = s.responseHeaders;
          resp.statusCode = s.statusCode;
          push(null, resp);
        }

        push(null, highland.nil);
      } else {
        resp.body = body;
        next();
      }
    })
    .errors(addRequestInfo(opts));

  // $FlowFixMe Monkey patch highland type.
  s3.abort = s.abort;

  return ((s3: any): AbortStream<Response>);
};
