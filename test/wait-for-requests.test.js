import waitForRequests from '../source/wait-for-requests.js';

import {
  describe,
  beforeEach,
  afterEach,
  it,
  jasmine,
  expect,
  jest
} from './jasmine.js';

import type { Agent } from 'http';

describe('waitForRequests', () => {
  let agent: Agent, spy;

  beforeEach(() => {
    agent = (({
      sockets: {
        socket1: {}
      }
    }: any): Agent);

    spy = jasmine.createSpy('spy');

    jest.useFakeTimers();

    waitForRequests(agent)(spy);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('with sockets', () => {
    beforeEach(() => {
      jest.runTimersToTime(10);
    });

    it('should not call the done function if sockets still exist', () => {
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('without sockets', () => {
    beforeEach(() => {
      agent.sockets = {};
      jest.runTimersToTime(10);
    });

    it('should call the done function if there are no more sockets', () => {
      expect(spy).toHaveBeenCalledOnce();
    });
  });
});
