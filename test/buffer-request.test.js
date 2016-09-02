import highland from 'highland';

import { describe, beforeEach, it, jasmine, expect, jest } from './jasmine.js';

import { PassThrough } from 'stream';

describe('buffer request', () => {
  let bufferRequest,
    mockErrorBuffer,
    mockRequestStream,
    mockRequestStreamInner,
    rStream,
    mockAddRequestInfo,
    mockBuildOptions;

  beforeEach(() => {
    rStream = new PassThrough();
    rStream.abort = 'abort';

    mockRequestStreamInner = jasmine
      .createSpy('requestStreamInner')
      .and.returnValue(rStream);

    mockRequestStream = jasmine
      .createSpy('requestStream')
      .and.returnValue(mockRequestStreamInner);
    jest.mock('../source/request-stream.js', () => mockRequestStream);

    mockErrorBuffer = jasmine.createSpy('errorBuffer').and.callFake(x => x);
    jest.mock('../source/error-buffer.js', () => mockErrorBuffer);

    mockAddRequestInfo = jasmine.createSpy('addRequestInfo');
    jest.mock('../source/add-request-info.js', () => mockAddRequestInfo);

    mockBuildOptions = jasmine.createSpy('buildOptions').and.callFake(obj => {
      obj.built = 'options';
      return obj;
    });
    jest.mock('../source/build-options.js', () => mockBuildOptions);

    bufferRequest = require('../source/buffer-request.js').default;
  });

  it('should be a function', () => {
    expect(bufferRequest).toEqual(jasmine.any(Function));
  });

  it('should call mockRequestStream with the expected args', () => {
    expect.assertions(2);

    bufferRequest('transport', 'agent')({ foo: 'baz' }, null);

    expect(mockRequestStream).toHaveBeenCalledOnceWith('transport', 'agent');

    expect(mockRequestStreamInner).toHaveBeenCalledOnceWith(
      {
        built: 'options',
        foo: 'baz'
      },
      null
    );
  });

  it('should call requestStream with a buffer', () => {
    bufferRequest('transport', 'agent')(
      {
        foo: 'bar'
      },
      new Buffer('abc')
    );

    expect(mockRequestStream).toHaveBeenCalledOnceWith('transport', 'agent');

    expect(mockRequestStreamInner).toHaveBeenCalledOnceWith(
      {
        built: 'options',
        foo: 'bar'
      },
      jasmine.any(Buffer)
    );
  });

  describe('invoking', () => {
    let s;

    beforeEach(() => {
      s = bufferRequest('transport', 'agent')({ foo: 'baz' }, null);
    });

    it('should expose abort on s', () => {
      expect(s.abort).toBe('abort');
    });

    it('should call the errorBuffer', () => {
      expect(
        highland.isStream(mockErrorBuffer.calls.mostRecent().args[0])
      ).toBe(true);
    });

    it('should return a response with no body', done => {
      rStream.responseHeaders = {
        ETag: 1441818174.97
      };
      rStream.statusCode = 304;
      rStream.end();

      s
        .each(x => {
          expect(x).toEqual({
            body: '',
            headers: {
              ETag: 1441818174.97
            },
            statusCode: 304
          });
        })
        .done(done);
    });

    it('should return a response with a body', done => {
      rStream.responseHeaders = {
        'Content-Length': 1
      };
      rStream.statusCode = 200;

      rStream.write('a');
      rStream.end();

      s
        .each(x => {
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
