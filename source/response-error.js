// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

export default class ResponseError extends Error {
  constructor(code: number, message?: string) {
    super(message);

    this.statusCode = code;
  }
  statusCode: number;
}
