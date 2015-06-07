/**
 * Implements a 1D transposed direct form II digital filter structure.
 *
 * Supports FIR and IIR filters and inital and final conditions.
 *
 * A frequency domain description of this filter is as follows:
 *
 *              b(0) + b(1)z^-1 + ... + b(nb)z^-nb
 *     Y(z) = ______________________________________ * X(z)
 *                1 + a(1)z^-1 + ... +a(na)z^-na
 *
 * Throws range error if a(0) = 0 or if initial condition sequence z
 * is not equal to the larger of either length of a or the length of b.
 *
 * Example usage - Calculate the impulse response of the following filter:
 *
 *     x = impulse(141, 20);
 *     b = [1];
 *     a = [1, -1, 0.9];
 *     h = filter1d(b, a, x);
 *     y = getResponse(h);  // The filter response.
 *     z = getConditions(h);  // The final conditions of the filter.
 *     s = math.sum(math.abs(y)); // The magnitude of the response.
 *
 * TODO: Normalize all coefficients if a[0] not equal to 1.
 *
 */

/* global math: false */
/* jshint node: true, browser: true, esnext: true */

"use strict";

(function () {

  math.import({

    filter1d: function filter1d(b, a, x, z) {
      var ai, bi, y;
      if (a[0] === 0) {
        throw new RangeError("The coefficient a[0] can not be 0.");
      }
      var n = math.max(a.length, b.length);
      if (z === undefined) {
        z = math.zeros(n);
      } else if (z.length != n) {
        throw new RangeError("The intial condition sequence z is the wrong size.");
      }

      if (a.length > b.length) {
        bi = b.concat(new Array(a.length - b.length).fill(0));
        ai = a.slice();
      } else if (b.length > a.length) {
        ai = a.concat(new Array(a.length - b.length).fill(0));
        bi = b.slice();
      } else {
        ai = a.slice();
        bi = b.slice();
      }

      //if (z === null) z = math.zeros(n);
      y = math.zeros(x.length);
      for (var i = 0; i < y.length; i++) {
        y[i] = bi[0] * x[i] + z[0];
        for (var j = 1; j < n; j++) {
          z[j - 1] = bi[j] * x[i] + z[j] - ai[j] * y[i];
        }
      }
      return {
        response: y,
        conditions: z
      };
    },
    // Helper functions to retrieve arrays from
    // multiple return objects.
    getResponse: function getReal(complexObject) {
      return math.eval("response", complexObject);
    },
    getConditions: function getImag(complexObject) {
      return math.eval("conditions", complexObject);
    }
  }, {
    wrap: true
  });

}());