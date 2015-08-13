'use strict';

var buildOptions = require('../build-options');

describe('build options', function () {
  var opts, result;
  beforeEach(function () {
    opts = {
      host: 'localhost:8000',
      hostname: 'localhost',
      port: '8000',
      method: 'GET',
      headers: {},
      qs: {
        foo: 'bar',
        baz: ['qux', 'quux']
      },
      path: '/api/my/test/dir',
      json: {}
    };
  });

  describe('with json', function () {
    beforeEach(function () {
      result = buildOptions(opts);
    });

    it('should give appropriate results', function () {
      expect(result).toEqual({
        host: 'localhost:8000',
        hostname: 'localhost',
        port: '8000',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Connection: 'keep-alive',
          'Content-Type': 'application/json; charset=UTF-8',
          'Transfer-Encoding': 'chunked'
        },
        qs: { foo: 'bar', baz: [ 'qux', 'quux' ] },
        path: '/api/my/test/dir/?foo=bar&baz=qux&baz=quux',
        json: {}
      });
    });
  });

  describe('without json', function () {
    beforeEach(function () {
      delete opts.json;
      result = buildOptions(opts);
    });

    it('should give appropriate results', function () {
      expect(result).toEqual({
        host: 'localhost:8000',
        hostname: 'localhost',
        port: '8000',
        method: 'GET',
        headers: {
          Connection: 'keep-alive',
          'Transfer-Encoding': 'chunked'
        },
        qs: { foo: 'bar', baz: [ 'qux', 'quux' ] },
        path: '/api/my/test/dir/?foo=bar&baz=qux&baz=quux'
      });
    });
  });
});
