'use strict';

var rewire = require('rewire');
var waitForRequests = rewire('../wait-for-requests');

describe('waitForRequests', function () {
  var revert, clearInterval, agent, setInterval, spy, fn;
  beforeEach(function () {
    agent = {
      sockets: {
        socket1: {}
      }
    };
    clearInterval = jasmine.createSpy('clearInterval');
    setInterval = jasmine.createSpy('setInterval');

    revert = waitForRequests.__set__({
      clearInterval: clearInterval,
      setInterval: setInterval
    });

    spy = jasmine.createSpy('spy');

    setInterval.and.callFake(function (cb) {
      fn = cb;
    });

    waitForRequests(agent, spy);
  });

  afterEach(function () {
    revert();
  });

  it('should turn every 10 seconds', function () {
    expect(setInterval).toHaveBeenCalledOnceWith(jasmine.any(Function), 10);
  });

  describe('with sockets', function () {
    beforeEach(function () {
      fn();
    });

    it('should not call the done function if sockets still exist', function () {
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call clearInterval if sockets still exist', function () {
      expect(clearInterval).not.toHaveBeenCalled();
    });
  });

  describe('without sockets', function () {
    beforeEach(function () {
      agent.sockets = {};
      fn();
    });

    it('should call the done function if there are no more sockets', function () {
      expect(spy).toHaveBeenCalledOnce();
    });

    it('should clear the interval if there are no more sockets', function () {
      expect(clearInterval).toHaveBeenCalledOnce();
    });
  });
});
