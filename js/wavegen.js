/* global math: false */
/* jshint node: true, browser: true, esnext: true */

// TODO: Refactor to remove redundant code

"use strict";

(function () {

  math.import({

    sinewave: function sinewave(amp, cycles, slength) {
      var _amplitude = amp !== undefined ? amp : 1,
          _cycles = cycles !== undefined ? cycles : 1,
          _samples_length = slength !== undefined ? slength : 500,
          _samples = new Array(_samples_length),
          _sample = 0,
          _step = Math.PI * 2 * _cycles / _samples_length;
      
      for (var i = 0; i < _samples_length; i++) {
        _samples[i] = _amplitude * Math.sin(_sample);
        _sample += _step;
      }

      return _samples;
    },
    
    squarewave: function squarewave(amp, cycles, slength, scale) {
      var _amplitude = amp !== undefined ? amp : 1,
          _cycles = cycles !== undefined ? cycles : 1,
          _samples_length = slength !== undefined ? slength : 500,
          _amplify = scale !== undefined ? scale : 20,
          _samples = new Array(_samples_length),
          _sample = 0, _preamp,
          _step = Math.PI * 2 * _cycles / _samples_length;
      
      for (var i = 0; i < _samples_length; i++) {
        _preamp = _amplitude * Math.sin(_sample);
        if (_amplify * Math.abs(_preamp) > _amplitude) {
          _samples[i] = Math.sign(_preamp) * _amplitude;
        } else {
          _samples[i] = _amplify * _preamp;
        }
        _sample += _step;
      }

      return _samples;
    },
    
    sawtoothwave: function sawtoothwave(amp, cycles, slength) {
      var _amplitude = amp !== undefined ? amp : 1,
          _cycles = cycles !== undefined ? cycles : 1,
          _samples_length = slength !== undefined ? slength : 500,
          _samples = new Array(_samples_length),
          _sample = 0,
          _scale = -(2 / Math.PI) * _amplitude,
          _step = Math.PI * _cycles / _samples_length;
      
      for (var i = 0; i < _samples_length; i++) {
        _samples[i] = _scale * Math.atan(1 / Math.tan(_sample));
        _sample += _step;
      }

      return _samples;
    },
    
    trianglewave: function trianglewave(amp, cycles, slength) {
      var _amplitude = amp !== undefined ? amp : 1,
          _cycles = cycles !== undefined ? cycles : 1,
          _samples_length = slength !== undefined ? slength : 500,
          _samples = new Array(_samples_length),
          _sample = 0,
          _scale = (2 / Math.PI) * _amplitude,
          _step = Math.PI * 2 * _cycles / _samples_length;
      
      for (var i = 0; i < _samples_length; i++) {
        _samples[i] = _scale * Math.asin(Math.sin(_sample));
        _sample += _step;
      }

      return _samples;
    }
  }, {
    wrap: true
  });
}());