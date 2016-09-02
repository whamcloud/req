import { describe, beforeEach, it, jasmine, expect, jest } from './jasmine.js';

describe('masking', () => {
  let mask, mockJsonMask;

  beforeEach(() => {
    mockJsonMask = jasmine.createSpy('jsonMask');

    jest.mock('json-mask', () => mockJsonMask);

    mask = require('../source/mask.js').default;
  });

  describe('with a mask', () => {
    let data, theMask, result, maskedData;

    beforeEach(() => {
      data = {
        key: 'value',
        key2: 'value'
      };
      theMask = 'key';
      maskedData = { key: 'value' };

      mockJsonMask.and.returnValue(maskedData);

      result = mask(theMask)(data);
    });

    it('should call json-mask with the stream data and the mask', () => {
      expect(mockJsonMask).toHaveBeenCalledOnceWith(data, theMask);
    });

    it('should receive the masked data', () => {
      expect(result).toEqual(maskedData);
    });

    describe('that returns null', () => {
      beforeEach(() => {
        mockJsonMask.and.returnValue(null);
      });

      it('should throw an error', () => {
        function shouldThrow() {
          mask(theMask)(data);
        }

        expect(shouldThrow).toThrow(
          new Error(
            'The json mask did not match the response and as a\
 result returned null. Examine the mask: "key"'
          )
        );
      });

      it('should have a status code of 400', () => {
        let error;

        try {
          mask(theMask)(data);
        } catch (e) {
          error = e;
        }

        expect(error.statusCode).toBe(400);
      });
    });
  });

  describe('without a mask', () => {
    let data, result;
    beforeEach(() => {
      data = {
        key: 'value',
        key2: 'value'
      };

      result = mask(undefined)(data);
    });

    it('should return the whole object', () => {
      expect(result).toEqual(data);
    });

    it('should not call json-mask', () => {
      expect(mockJsonMask).not.toHaveBeenCalled();
    });
  });
});
