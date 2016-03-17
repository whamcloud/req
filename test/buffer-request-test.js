'use strict';

var rewire = require('rewire');
var bufferRequest = rewire('../buffer-request');
var fp = require('intel-fp');
var λ = require('highland');
var PassThrough = require('stream').PassThrough;

describe('buffer request', function () {
  var revert,
    errorBuffer,
    requestStream, rStream,
    addRequestInfo, buildOptions,
    through;

  beforeEach(function () {
    rStream = new PassThrough();
    rStream.abort = 'abort';
    requestStream = jasmine.createSpy('requestStream')
      .and.returnValue(rStream);

    errorBuffer = jasmine.createSpy('errorBuffer')
      .and.callFake(fp.identity);

    through = {
      bufferString: jasmine.createSpy('bufferString')
        .and.callFake(function (s) {
          return s.invoke('toString', ['utf8']);
        })
    };

    addRequestInfo = jasmine.createSpy('addRequestInfo');

    buildOptions = jasmine.createSpy('buildOptions')
      .and.callFake(function (obj) {
        obj.built = 'options';
        return obj;
      });

    revert = bufferRequest.__set__({
      addRequestInfo: addRequestInfo,
      buildOptions: buildOptions,
      errorBuffer: errorBuffer,
      requestStream: requestStream,
      through: through
    });
  });

  afterEach(function () {
    revert();
  });

  it('should be a function', function () {
    expect(bufferRequest).toEqual(jasmine.any(Function));
  });

  it('should call requestStream with the expected args', function () {
    bufferRequest('transport', 'agent', { foo: 'baz' }, null);

    expect(requestStream)
      .toHaveBeenCalledOnceWith('transport', 'agent', {
        built: 'options',
        foo: 'baz'
      }, null);
  });

  it('should call requestStream with a buffer', function () {
    bufferRequest('transport', 'agent', {
      foo: 'bar'
    }, new Buffer('abc'));

    expect(requestStream)
      .toHaveBeenCalledOnceWith('transport', 'agent', {
        built: 'options',
        foo: 'bar'
      }, jasmine.any(Buffer));
  });

  describe('invoking', function () {
    var s;

    beforeEach(function () {
      s = bufferRequest('transport', 'agent', { foo: 'baz' }, null);
    });

    it('should expose abort on s', function () {
      expect(s.abort).toBe('abort');
    });

    it('should call the errorBuffer', function () {
      expect(λ.isStream(errorBuffer.calls.mostRecent().args[0])).toBe(true);
    });

    it('should call bufferString', function () {
      expect(λ.isStream(through.bufferString.calls.mostRecent().args[0])).toBe(true);
    });

    it('should return a response with no body', function (done) {
      rStream.responseHeaders = {
        ETag: 1441818174.97
      };
      rStream.statusCode = 304;
      rStream.end();

      s
        .each(function (x) {
          expect(x).toEqual({
            body: null,
            headers: {
              ETag: 1441818174.97
            },
            statusCode: 304
          });
        })
        .done(done);
    });

    it('should return a response with a body', function (done) {
      rStream.responseHeaders = {
        'Content-Length': 1
      };
      rStream.statusCode = 200;

      rStream.write('a');
      rStream.end();

      s
        .each(function (x) {
          expect(x).toEqual({
            body: 'a',
            headers: {
              'Content-Length': 1
            },
            statusCode: 200
          });
        })
        .done(done);
    });
  });
});
