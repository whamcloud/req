import addRequestInfo from '../source/add-request-info.js';

import { describe, beforeEach, it, jasmine, expect } from './jasmine.js';

describe('add request info', () => {
  let options, err, push;

  beforeEach(() => {
    options = {
      method: 'GET',
      path: '/api/alert'
    };
    err = { message: 'error message' };
    push = jasmine.createSpy('push');

    addRequestInfo(options)(err, push);
  });

  describe('errors', () => {
    let expectedError;
    beforeEach(() => {
      expectedError = {
        message: 'error message From GET request to /api/alert'
      };
    });

    it('should push the error', () => {
      expect(push).toHaveBeenCalledOnceWith(expectedError);
    });
  });
});
