// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import type { Agent } from 'http';

export default (agent: Agent) => (done: () => void) => {
  const x = setInterval(() => {
    if (Object.keys(agent.sockets).length) return;

    clearInterval(x);
    done();
  }, 10);
};
