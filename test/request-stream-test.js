'use strict';

var requestStream = require('../request-stream');
var PassThrough = require('stream').PassThrough;
var λ = require('highland');
var fp = require('@intel-js/fp');

describe('request', function () {
  var request, r, s, rs, req, onResponse;
  beforeEach(function () {

    req = new PassThrough();
    req.setHeader = jasmine.createSpy('setHeader');
    req.abort = jasmine.createSpy('abort');
    r = new PassThrough();
    onResponse = fp.noop;

    request = jasmine.createSpy('request').and.callFake(function (options, fn) {
      var bound = fn.bind(null, r);
      process.nextTick(fp.flow(bound, onResponse));

      return req;
    });

    rs = requestStream({
      request: request
    }, {});
  });

  describe('the request', function () {
    var buffer;

    beforeEach(function () {
      buffer = 'buffer';
      s = rs({ path: '/api/alert/' }, buffer);
    });

    it('should call setHeader on the request', function (done) {
      λ(req)
        .errors(done.fail)
        .each(function () {
          expect(req.setHeader).toHaveBeenCalledOnceWith('content-length', buffer.length);

          done();
        });
    });

    it('should write the buffer to the request', function (done) {
      λ(req)
        .errors(done.fail)
        .each(function (data) {
          expect(data + '').toEqual(buffer);
          done();
        });
    });

    it('should handle errors on the request', function (done) {
      var err = new Error('error on request');

      λ(s)
        .errors(function (e) {
          expect(e).toEqual(err);
          done();
        })
        .each(fp.noop);

      req.emit('error', err);
    });

    it('should end', function (done) {
      var spy = jasmine.createSpy('spy');

      req.once('end', spy);
      req.once('end', function () {
        expect(spy).toHaveBeenCalledOnce();
        done();
      });
      req.once('error', done.fail);
      req.read();
    });
  });

  describe('the response', function () {
    it('should receive the chunk on the response stream', function (done) {
      var chunk = 'test';
      s = rs({path: '/api/alert/'}, 'buffer');
      r.write(chunk);
      r.headers = {header: 'header'};
      r.end();

      λ(s)
        .errors(done.fail)
        .each(function (data) {
          expect(data + '').toEqual(chunk);
          expect(s.responseHeaders).toEqual(r.headers);

          done();
        });
    });

    it('should handle error when status code is greater than 400', function (done) {
      r.statusCode = 404;
      s = rs({path: '/api/alert/'}, 'buffer');
      λ(s)
        .errors(function (e) {
          expect(e.statusCode).toEqual(404);
          done();
        })
        .each(fp.noop);
    });

    it('should pass abort to output stream', function () {
      expect(s.abort).toEqual(jasmine.any(Function));
    });

    describe('passthrough error', function () {
      var err;
      beforeEach(function () {
        err = new Error('i am an error');
      });

      it('should display message if error occurs in next tick', function (done) {

        onResponse = function () {
          r.write('test');
          process.nextTick(function () {
            r.emit('error', err);
          });
        };

        s = rs({path: '/api/alert/'}, 'buffer');

        λ(s)
          .errors(function (e) {
            expect(e).toEqual(err);
            done();
          })
          .each(function (data) {
            expect(data.toString()).toEqual('test');
          });
      });
    });
  });
});
