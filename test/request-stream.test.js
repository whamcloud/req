import highland from 'highland';
import requestStream from '../source/request-stream.js';

import { PassThrough } from 'stream';

import { flow } from '@mfl/fp';
import { describe, beforeEach, it, jasmine, expect } from './jasmine.js';

describe('request', () => {
  let request, r, s, rs, req, onResponse;

  beforeEach(() => {
    req = new PassThrough();
    req.setHeader = jasmine.createSpy('setHeader');
    req.abort = jasmine.createSpy('abort');
    r = new PassThrough();
    onResponse = () => {};

    request = jasmine.createSpy('request').and.callFake((options, fn) => {
      const bound = fn.bind(null, r);
      process.nextTick(flow(bound, onResponse));

      return req;
    });

    rs = requestStream(
      {
        request: request
      },
      {}
    );
  });

  describe('the request', () => {
    let buffer;

    beforeEach(() => {
      buffer = 'buffer';
      s = rs({ path: '/api/alert/' }, buffer);
    });

    it('should call setHeader on the request', done => {
      highland(req).errors(done.fail).each(() => {
        expect(req.setHeader).toHaveBeenCalledOnceWith(
          'Content-Length',
          buffer.length.toString()
        );

        done();
      });
    });

    it('should write the buffer to the request', done => {
      highland(req).errors(done.fail).each(data => {
        expect(data + '').toEqual(buffer);
        done();
      });
    });

    it('should handle errors on the request', done => {
      const err = new Error('error on request');

      highland(s)
        .errors(e => {
          expect(e).toEqual(err);
          done();
        })
        .each(() => {});

      req.emit('error', err);
    });

    it('should end', done => {
      const spy = jasmine.createSpy('spy');

      req.once('end', spy);
      req.once('end', () => {
        expect(spy).toHaveBeenCalledOnce();
        done();
      });
      req.once('error', done.fail);
      req.read();
    });
  });

  describe('the response', () => {
    it('should receive the chunk on the response stream', done => {
      const chunk = 'test';
      s = rs({ path: '/api/alert/' }, 'buffer');
      r.write(chunk);
      r.headers = { header: 'header' };
      r.end();

      highland(s).errors(done.fail).each(data => {
        expect(data + '').toEqual(chunk);
        expect(s.responseHeaders).toEqual(r.headers);

        done();
      });
    });

    it('should handle error when status code is greater than 400', done => {
      r.statusCode = 404;
      s = rs({ path: '/api/alert/' }, 'buffer');
      highland(s)
        .errors(e => {
          expect(e.statusCode).toEqual(404);
          done();
        })
        .each(() => {});
    });

    it('should pass abort to output stream', () => {
      expect(s.abort).toEqual(jasmine.any(Function));
    });

    describe('passthrough error', () => {
      let err;
      beforeEach(() => {
        err = new Error('i am an error');
      });

      it('should display message if error occurs in next tick', done => {
        onResponse = () => {
          r.write('test');
          process.nextTick(() => {
            r.emit('error', err);
          });
        };

        s = rs({ path: '/api/alert/' }, 'buffer');

        highland(s)
          .errors(e => {
            expect(e).toEqual(err);
            done();
          })
          .each(data => {
            expect(data.toString()).toEqual('test');
          });
      });
    });
  });
});
