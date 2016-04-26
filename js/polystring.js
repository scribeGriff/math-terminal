/* global math: false, katex: false */
/* jshint node: true, browser: true, esnext: true */


"use strict";

(function () {

  math.import({

    polystring: function polystring (coeffArray, expArray) {
      var sb = 'f(z) = ',
          firstIndex = 0,
          exponent,
          coeff,
          variable = 'z',
          _formatString;

      while (coeffArray[firstIndex] === 0) {
        firstIndex++;
      }

      if (expArray[firstIndex] === 0) {
        exponent = '';
        variable = '';
      } else if (expArray[firstIndex] === -1) {
        exponent = '';
      } else {
        exponent = '^' + -1 * expArray[firstIndex];
      }

      // Format the first non-zero element.
      if (coeffArray[firstIndex] !== 0) {
        if (variable === '') {
          coeff = coeffArray[firstIndex];
        } else {
          coeff = math.abs(coeffArray[firstIndex]) === 1 ? '' : coeffArray[firstIndex];
        }
        sb += coeff + variable + exponent;
      }

      firstIndex++;

      for (var i = firstIndex; i < expArray.length; i++) {
        variable = 'z';

        // Format the exponent.
        if (expArray[i] === 0) {
          exponent = '';
          variable = '';
        } else if (expArray[i] === -1) {
          exponent = '';
        } else {
          exponent = '^' + -1 * expArray[i];
        }

        if (coeffArray[i] !== 0) {
          if (coeffArray[i] > 0) {
            if (variable === '') {
              coeff = coeffArray[i];
            } else {
              coeff = coeffArray[i] === 1 ? '' : coeffArray[i];
            }
            sb += ' + ' + coeff + variable + exponent;
          } else if (coeffArray[i] < 0) {
            if (variable === '') {
              coeff = math.abs(coeffArray[i]);
            } else {
              coeff = coeffArray[i] == -1 ? '' : math.abs(coeffArray[i]);
            }
            sb += ' - ' + coeff + variable + exponent;
          }
        }
      }
      
      return katex.renderToString(math.parse(sb).toTex({implicit: 'hide'}));
    }
  }, {
    wrap: true
  });
}());