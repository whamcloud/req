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
