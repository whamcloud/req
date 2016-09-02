// @flow

import http from 'http';
import getReq from '../../source/index.js';

import ResponseError from '../../source/response-error.js';

import {
  describe,
  beforeEach,
  afterEach,
  it,
  jasmine,
  expect
} from '../jasmine.js';

function createServer(handler) {
  const server = http.createServer(handler);

  server.listen(9999);

  return server;
}

describe('req test', () => {
  describe('plain text success', () => {
    let server;

    beforeEach(() => {
      server = createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write('Hello ');
        res.end('World');
      });
    });

    afterEach(done => {
      server.close(err => {
        if (err) done.fail(err);
        else done();
      });
    });

    it('should return the body', done => {
      getReq('http')
        .bufferRequest({
          headers: {
            Connection: 'close'
          },
          path: 'localhost',
          port: 9999
        })
        .each(x => {
          expect(x.body).toEqual('Hello World');
        })
        .stopOnError(done.fail)
        .done(done);
    });
  });

  describe('plain text failure', () => {
    let server, req;

    beforeEach(() => {
      server = createServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Oh Noes');
      });

      req = getReq('http').bufferRequest({
        headers: {
          Connection: 'close'
        },
        path: 'localhost',
        port: 9999
      });
    });

    afterEach(done => {
      server.close(err => {
        if (err) done.fail(err);
        else done();
      });
    });

    it('should return the error', done => {
      req
        .stopOnError(err => {
          expect(err).toEqual(
            new Error('Oh Noes From GET request to /localhost/')
          );
        })
        .each(() => {
          done.fail('Should not reach here');
        })
        .done(done);
    });

    it('should return the error status code', done => {
      req
        .stopOnError((err: ResponseError) => {
          expect(err.statusCode).toBe(500);
        })
        .each(() => {
          done.fail('Should not reach here');
        })
        .done(done);
    });
  });

  describe('json test', () => {
    describe('success', () => {
      let server;

      beforeEach(() => {
        server = createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write('{ "foo": ');
          res.end('"bar"}');
        });
      });

      afterEach(done => {
        server.close(err => {
          if (err) done.fail(err);
          else done();
        });
      });

      it('should return the expected response', done => {
        getReq('http')
          .bufferJsonRequest({
            headers: {
              Connection: 'close'
            },
            path: 'localhost',
            port: 9999
          })
          .each(x => {
            expect(x).toEqual({
              body: {
                foo: 'bar'
              },
              headers: {
                connection: 'close',
                'content-type': 'application/json',
                date: jasmine.any(String),
                'transfer-encoding': 'chunked'
              },
              statusCode: 200
            });
          })
          .stopOnError(done.fail)
          .done(done);
      });
    });

    describe('masking', () => {
      let server;

      beforeEach(() => {
        server = createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write('{ "foo": ');
          res.end('"bar", "bap": "boom"}');
        });
      });

      afterEach(done => {
        server.close(err => {
          if (err) done.fail(err);
          else done();
        });
      });

      it('should return the expected response', done => {
        getReq('http')
          .bufferJsonRequest({
            headers: {
              Connection: 'close'
            },
            jsonMask: 'foo',
            path: 'localhost',
            port: 9999
          })
          .each(x => {
            expect(x).toEqual({
              body: {
                foo: 'bar'
              },
              headers: {
                connection: 'close',
                'content-type': 'application/json',
                date: jasmine.any(String),
                'transfer-encoding': 'chunked'
              },
              statusCode: 200
            });
          })
          .stopOnError(done.fail)
          .done(done);
      });
    });

    describe('failure', () => {
      let server, req;

      beforeEach(() => {
        server = createServer((req, res) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end('Oh Noes');
        });

        req = getReq('http').bufferJsonRequest({
          headers: {
            Connection: 'close'
          },
          path: 'localhost',
          port: 9999
        });
      });

      afterEach(done => {
        server.close(err => {
          if (err) done.fail(err);
          else done();
        });
      });

      it('should return the error', done => {
        req
          .stopOnError(err => {
            expect(err).toEqual(
              new Error('Oh Noes From GET request to /localhost/')
            );
          })
          .each(() => {
            done.fail('Should not reach here');
          })
          .done(done);
      });

      it('should return the error status code', done => {
        req
          .stopOnError(err => {
            expect(err.statusCode).toBe(500);
          })
          .each(() => {
            done.fail('Should not reach here');
          })
          .done(done);
      });
    });
  });

  describe('posting', () => {
    let server;

    it('should send the json to the server', done => {
      server = createServer((req, res) => {
        let body = '';

        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', () => {
          expect(body).toBe('{"foo":"bar"}');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('');

          server.close(err => {
            if (err) done.fail(err);
            else done();
          });
        });
      });

      getReq('http').bufferJsonRequest({
        headers: {
          Connection: 'close'
        },
        json: { foo: 'bar' },
        method: 'POST',
        path: 'localhost',
        port: 9999
      });
    });
  });
});
