'use strict';

var rewire = require('rewire');
var addRequestInfo = rewire('../add-request-info');

describe('add request info', function () {
  var options, err, push;
  beforeEach(function () {
    options = {
      method: 'GET',
      path: '/api/alert'
    };
    err = { message: 'error message' };
    push = jasmine.createSpy('push');

    addRequestInfo(options, err, push);
  });

  describe('errors', function () {
    var expectedError;
    beforeEach(function () {
      expectedError = {
        message: 'error message From GET request to /api/alert'
      };
    });

    it('should push the error', function () {
      expect(push).toHaveBeenCalledOnceWith(expectedError);
    });
  });
});
