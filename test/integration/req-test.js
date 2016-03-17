'use strict';

var http = require('http');
var getReq = require('../../index');

function createServer (handler) {
  var server = http
    .createServer(handler);

  server.listen(9999);

  return server;
}

describe('req test', function () {
  describe('plain text success', function () {
    var server;

    beforeEach(function () {
      server = createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write('Hello ');
        res.end('World');
      });
    });

    afterEach(function (done) {
      server.close(function (err) {
        if (err)
          done.fail(err);
        else
          done();
      });
    });

    it('should return the body', function (done) {
      getReq('http').bufferRequest({
        headers: {
          Connection: 'close'
        },
        path: 'localhost',
        port: 9999
      }, null)
      .each(function (x) {
        expect(x.body).toEqual('Hello World');
      })
      .stopOnError(done.fail)
      .done(done);
    });
  });

  describe('plain text failure', function () {
    var server, req;

    beforeEach(function () {
      server = createServer(function (req, res) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Oh Noes');
      });

      req = getReq('http').bufferRequest({
        headers: {
          Connection: 'close'
        },
        path: 'localhost',
        port: 9999
      }, null);
    });

    afterEach(function (done) {
      server.close(function (err) {
        if (err)
          done.fail(err);
        else
          done();
      });
    });

    it('should return the error', function (done) {
      req
      .stopOnError(function (err) {
        expect(err).toEqual(new Error('Oh Noes From GET request to /localhost/'));
      })
      .each(function () {
        done.fail('Should not reach here');
      })
      .done(done);
    });

    it('should return the error status code', function (done) {
      req
      .stopOnError(function (err) {
        expect(err.statusCode).toBe(500);
      })
      .each(function () {
        done.fail('Should not reach here');
      })
      .done(done);
    });
  });

  describe('json test', function () {
    describe('success', function () {
      var server;

      beforeEach(function () {
        server = createServer(function (req, res) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write('{ "foo": ');
          res.end('"bar"}');
        });
      });

      afterEach(function (done) {
        server.close(function (err) {
          if (err)
            done.fail(err);
          else
            done();
        });
      });

      it('should return the expected response', function (done) {
        getReq('http').bufferJsonRequest({
          headers: {
            Connection: 'close'
          },
          path: 'localhost',
          port: 9999
        })
        .each(function (x) {
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

    describe('masking', function () {
      var server;

      beforeEach(function () {
        server = createServer(function (req, res) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write('{ "foo": ');
          res.end('"bar", "bap": "boom"}');
        });
      });

      afterEach(function (done) {
        server.close(function (err) {
          if (err)
            done.fail(err);
          else
            done();
        });
      });

      it('should return the expected response', function (done) {
        getReq('http').bufferJsonRequest({
          headers: {
            Connection: 'close'
          },
          jsonMask: 'foo',
          path: 'localhost',
          port: 9999
        })
        .each(function (x) {
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

    describe('failure', function () {
      var server, req;

      beforeEach(function () {
        server = createServer(function (req, res) {
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

      afterEach(function (done) {
        server.close(function (err) {
          if (err)
            done.fail(err);
          else
            done();
        });
      });

      it('should return the error', function (done) {
        req
        .stopOnError(function (err) {
          expect(err).toEqual(new Error('Oh Noes From GET request to /localhost/'));
        })
        .each(function () {
          done.fail('Should not reach here');
        })
        .done(done);
      });

      it('should return the error status code', function (done) {
        req
        .stopOnError(function (err) {
          expect(err.statusCode).toBe(500);
        })
        .each(function () {
          done.fail('Should not reach here');
        })
        .done(done);
      });
    });
  });

  describe('posting', function () {
    var server;

    it('should send the json to the server', function (done) {
      server = createServer(function (req, res) {
        var body = '';

        req.on('data', function (chunk) {
          body += chunk;
        });

        req.on('end', function () {
          expect(body).toBe('{"foo":"bar"}');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('');

          server.close(function (err) {
            if (err)
              done.fail(err);
            else
              done();
          });
        });
      });

      getReq('http').bufferJsonRequest({
        headers: {
          Connection: 'close'
        },
        json: {foo: 'bar'},
        method: 'POST',
        path: 'localhost',
        port: 9999
      });
    });
  });
});
