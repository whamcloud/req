// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import http from 'http';
import https from 'https';
import bufferRequest from './buffer-request.js';
import waitForRequests from './wait-for-requests.js';
import bufferJsonRequest from './buffer-json-request.js';

import type { Agent } from 'http';

export type { InputOptions, Options } from './build-options.js';
export type { JsonResponse } from './buffer-json-request.js';

export type Transports = 'http' | 'https';

export type TransportModules = typeof https | typeof http;

const transports = {
  http,
  https
};

export default (transport: Transports = 'https', agent?: Agent) => {
  const t = transports[transport];

  agent =
    agent ||
    // $FlowFixMe https does not have Agent type.
    new t.Agent({
      keepAlive: true,
      maxSockets: Infinity, // Just for Node 0.10,
      rejectUnauthorized: false // Just for Node 0.10
    });

  return {
    bufferJsonRequest: bufferJsonRequest(t, agent),
    bufferRequest: bufferRequest(t, agent),
    waitForRequests: waitForRequests(agent)
  };
};
