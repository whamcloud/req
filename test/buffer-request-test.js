'use strict';

var rewire = require('rewire');
var bufferRequest = rewire('../buffer-request');
var fp = require('intel-fp');
var λ = require('highland');
var PassThrough = require('stream').PassThrough;

describe('buffer request', function () {
  var revert, options,
    errorBuffer,
    requestStream, rStream,
    requestResult,
    addRequestInfo, buildOptions, opts, jsonMask,
    through;

  beforeEach(function () {
    options = {
      path: 'test/path'
    };
    opts = {};
    requestResult = ['{"result": "result"}'];

    rStream = new PassThrough();
    rStream.abort = 'abort';
    requestStream = jasmine.createSpy('requestStream')
      .and.returnValue(rStream);

    errorBuffer = jasmine.createSpy('errorBuffer')
      .and.callFake(fp.identity);

    through = {
      toJson: jasmine.createSpy('toJson')
        .and.callFake(fp.identity),
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

    jsonMask = jasmine.createSpy('jsonMask')
      .and.callFake(function mask (x, s) {
        return s;
      });

    revert = bufferRequest.__set__({
      requestStream: requestStream,
      errorBuffer: errorBuffer,
      through: through,
      addRequestInfo: addRequestInfo,
      buildOptions: buildOptions,
      jsonMask: fp.curry(2, jsonMask)
    });
  });

  afterEach(function () {
    revert();
  });

  it('should be a function', function () {
    expect(bufferRequest).toEqual(jasmine.any(Function));
  });

  it('should call requestStream with the expected args', function () {
    bufferRequest('transport', 'agent', { foo: 'baz' });

    expect(requestStream)
      .toHaveBeenCalledOnceWith('transport', 'agent', {
        foo: 'baz',
        built: 'options'
      }, undefined);
  });

  it('should call requestStream with a buffer', function () {
    bufferRequest('transport', 'agent', {
      jsonMask: 'objects',
      json: '{}'
    });

    expect(requestStream)
      .toHaveBeenCalledOnceWith('transport', 'agent', {
        json: '{}',
        built: 'options'
      }, jasmine.any(Buffer));
  });

  it('should mask JSON passed in', function () {
    bufferRequest('transport', 'agent', {
      jsonMask: 'objects',
      json: '{}'
    });

    expect(jsonMask)
      .toHaveBeenCalledOnceWith('objects', jasmine.any(Object));
  });

  describe('invoking', function () {
    var s;

    beforeEach(function () {
      s = bufferRequest('transport', 'agent', { foo: 'baz' });
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

    it('should call toJson', function () {
      expect(λ.isStream(through.toJson.calls.mostRecent().args[0])).toBe(true);
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
            headers: {
              ETag: 1441818174.97
            },
            statusCode: 304,
            body: null
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
            headers: {
              'Content-Length': 1
            },
            statusCode: 200,
            body: 'a'
          });
        })
        .done(done);
    });
  });
});
