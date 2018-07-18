// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import type { Options } from './build-options.js';

export default (options: Options) => (error: Error, push: Error => void) => {
  error.message = `${error.message} From ${options.method} request to ${options.path}`;

  push(error);
};
