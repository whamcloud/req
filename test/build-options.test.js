import buildOptions from '../source/build-options.js';

import { describe, beforeEach, it, expect } from './jasmine.js';

describe('build options', () => {
  let opts, result;

  beforeEach(() => {
    opts = {
      headers: {},
      host: 'localhost:8000',
      hostname: 'localhost',
      method: 'GET',
      path: '/api/my/test/dir',
      port: '8000',
      qs: {
        baz: ['qux', 'quux'],
        foo: 'bar'
      }
    };

    result = buildOptions(opts);
  });

  it('should give appropriate results', () => {
    expect(result).toEqual({
      headers: {
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked'
      },
      host: 'localhost:8000',
      hostname: 'localhost',
      method: 'GET',
      path: '/api/my/test/dir/?baz=qux&baz=quux&foo=bar',
      port: '8000',
      qs: {
        baz: ['qux', 'quux'],
        foo: 'bar'
      },
      rejectUnauthorized: false
    });
  });
});
