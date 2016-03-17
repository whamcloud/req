'use strict';

var rewire = require('rewire');
var mask = rewire('../mask');
var fp = require('intel-fp');

describe('masking', function () {
  var jsonMask, revert;

  beforeEach(function () {
    jsonMask = jasmine.createSpy('jsonMask');

    revert = mask.__set__({
      jsonMask: fp.curry(2, jsonMask)
    });
  });

  afterEach(function () {
    revert();
  });

  describe('with a mask', function () {
    var data, theMask, result,
      maskedData;

    beforeEach(function () {
      data = {
        key: 'value',
        key2: 'value'
      };
      theMask = 'key';
      maskedData = {key: 'value'};

      jsonMask.and.returnValue(maskedData);

      result = mask(theMask)(data);
    });

    it('should call json-mask with the stream data and the mask', function () {
      expect(jsonMask).toHaveBeenCalledOnceWith(data, theMask);
    });

    it('should receive the masked data', function () {
      expect(result).toEqual(maskedData);
    });

    describe('that returns null', function () {

      beforeEach(function () {
        jsonMask.and.returnValue(null);
      });

      it('should throw an error', function () {
        function shouldThrow () {
          mask(theMask)(data);
        }

        expect(shouldThrow).toThrow(new Error('The json mask did not match the response and as a\
 result returned null. Examine the mask: "key"'));
      });

      it('should have a status code of 400', function () {
        var error;

        try {
          mask(theMask)(data);
        } catch (e) {
          error = e;
        }

        expect(error.statusCode).toBe(400);
      });
    });
  });

  describe('without a mask', function () {
    var data, result;
    beforeEach(function () {
      data = {
        key: 'value',
        key2: 'value'
      };

      result = mask(undefined)(data);
    });

    it('should return the whole object', function () {
      expect(result).toEqual(data);
    });

    it('should not call json-mask', function () {
      expect(jsonMask).not.toHaveBeenCalled();
    });
  });
});
