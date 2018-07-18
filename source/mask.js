// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import jsonMask from 'json-mask';
import ResponseError from './response-error.js';

export default (mask: ?string) => {
  if (!mask) return (x: Object) => x;

  return (x: Object) => {
    const response: Object = jsonMask(x, mask);

    if (response !== null) return response;

    throw new ResponseError(
      400,
      // $FlowFixMe there is nowhere in closure scope mask is being set to null.
      `The json mask did not match the response and as a result returned null. Examine the mask: "${mask}"`
    );
  };
};
