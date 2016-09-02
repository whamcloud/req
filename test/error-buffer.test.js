import highland from 'highland';
import errorBuffer from '../source/error-buffer.js';

import { describe, it, expect } from './jasmine.js';

describe('error buffer', () => {
  it('should pass through non-errors', () => {
    highland(['foo']).through(errorBuffer).each(x => {
      expect(x).toEqual('foo');
    });
  });

  it('should pass through stream errors', () => {
    highland([new StreamError(new Error('boom!'))])
      .through(errorBuffer)
      .errors(err => {
        expect(err).toEqual(new Error('boom!'));
      })
      .each(() => {});
  });

  it('should buffer bad status codes', () => {
    const err = new Error();
    err.statusCode = 400;

    highland([new StreamError(err), 'bo', 'om', '!'])
      .through(errorBuffer)
      .errors(err => {
        expect(err).toEqual(new Error('boom!'));
      })
      .each(() => {});
  });

  function StreamError(err) {
    this.__HighlandStreamError__ = true;
    this.error = err;
  }
});
