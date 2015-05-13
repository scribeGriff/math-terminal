/* global math: false */
/* jshint node: true, browser: true, esnext: true */

"use strict";

(function () {

  math.import({

    sine: function sine(amp, freq, slength) {
      var amplitude = amp !== undefined ? amp : 1,
          frequency = freq !== undefined ? freq : 440,
          samples_length = slength !== undefined ? slength : 441,
          samples = new Array(samples_length),
          t;
      for (var i = 0; i < samples_length; i++) {
        t = 1 - (i / samples_length);
        samples[i] = amplitude * Math.sin(frequency * 2 * Math.PI * t);
      }
      return math.matrix(samples);
    },
    square: function square(amp, freq, slength) {
    }
  }, {
    wrap: true
  });
}());