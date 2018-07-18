// @flow

//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import highland from 'highland';
import type { HighlandStreamT } from 'highland';

export default (s: HighlandStreamT<Buffer>) => {
  let incomingErr;

  return s.consume((err, chunk, push, next) => {
    if (chunk === highland.nil) return handleNil(chunk, push);
    else if (err) handleErr(err, push);
    else handleChunks(chunk, push);

    next();
  });

  function handleErr(err, push) {
    if (!err.statusCode) push(err);
    else incomingErr = err;
  }

  function handleNil(chunk, push) {
    if (incomingErr) push(incomingErr);

    push(null, chunk);
  }

  function handleChunks(chunk, push) {
    if (incomingErr) incomingErr.message += chunk.toString('utf-8');
    else push(null, chunk);
  }
};
