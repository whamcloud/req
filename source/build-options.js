// @flow

//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { stringify } from 'querystring';

export type InputOptions = {
  path: string,
  method?: string,
  rejectUnauthorized?: boolean,
  headers?: {
    [key: string]: string
  },
  jsonMask?: string,
  json?: Object,
  qs?: Object
};

export type Options = {
  ...$Exact<InputOptions>,
  +method: string,
  +rejectUnauthorized: boolean,
  +headers: {
    [key: string]: string
  }
};

export default ({
  method = 'GET',
  rejectUnauthorized = false,
  headers = {},
  ...rest
}: InputOptions) => {
  const options = {
    method,
    rejectUnauthorized,
    headers: {
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
      ...headers
    },
    ...rest
  };

  options.path = options.path.replace(/^\/*/, '/').replace(/\/*$/, '/');

  if (rest.qs) {
    const queryString = stringify(rest.qs);
    options.path = `${options.path}?${queryString}`;
  }

  return options;
};
