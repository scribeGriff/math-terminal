/* global math: false */
/* jshint node: true, browser: true, esnext: true */

"use strict";

(function () {

  math.import({

    /**
     * Perform linear convolution of two signals using N point circular convolution.
     * Accepts position information.  Returns the convolved
     * array y, and its position array n.
     *
     * Basic usage:
     *
     *     xdata = [3, 11, 7, 0, -1, 4, 2];
     *     hdata = [2, 3, 0, -5, 2, 1];
     *     y = conv(xdata, hdata);
     *
     * Accepts two optional parameters:
     * * A position array for the xdata.
     * * A position array for the hdata.
     *
     * If position arrays are not provided, the data sequence is assumed
     * to start at position n = 0.  If this is not the case, a position array
     * can be created using the range() method.
     *
     * Example optional usage:
     *
     *     xpos = range(-3, 3);  // -3, -2, -1, 0, 1, 2, 3
     *     hpos = range(-1, 4);  // -1, 0, 1, 2, 3, 4
     *     y = conv(xdata, hdata, xpos, hpos);
     *
     * The xdata and hdate arrays do not need to be the same length as we are
     * computing the circular convolution of two sequences and the
     * lists are padded to length one less than the sum of their
     * lengths.
    **/

    conv: function conv(xd, hd, xn, hn) {

      var xdata, hdata, xlen, hlen, yindex, ytime, yfft, xfft, hfft, yifft,
          infoString = 'The <em>myConv = conv(x, n)</em> function returns the results sequence, "y", retrieved with <em>y = getData("y", myConv)</em>, and the time order sequence "n", retrieved with <em>n = getData("n", myConv)</em>';

      const CSMALL = 12;

      // If a time vector hasn't been defined, define one that starts from 0 
      if (xn === undefined) {
        xn = new Array(xd.length).fill(0).map(function (x, i) { 
          return i; 
        });
      } else {
        xn = math.number(xn);
      }
      if (hn === undefined) {
        hn = new Array(hd.length).fill(0).map(function (x, i) { 
          return i; 
        });
      } else {
        hn = math.number(hn);
      }

      // Create a local copy of each list.  This is necessary
      // in case xd and hd are the same object.
      xdata = xd.slice();
      hdata = hd.slice();

      xlen = xdata.length;
      hlen = hdata.length;

      yindex = xn.indexOf(0) + hn.indexOf(0);
      ytime = new Array(xlen + hlen - 1).fill(0).map(function (x, i) { return i - yindex; });

      // Pad data with zeros to length required to compute circular convolution.
      xdata = xdata.concat(new Array(hlen - 1).fill(0));
      hdata = hdata.concat(new Array(xlen - 1).fill(0));

      xlen = xdata.length;

      // Take the fft of x(n) and h(n).
      xfft = math.fft(xdata);
      hfft = math.fft(hdata);

      yfft = new Array(xlen);

      // Multiply x(n) and h(n) in the frequency domain.
      for (var i = 0; i < xlen; i++) {
        yfft[i] = math.multiply(xfft[i], hfft[i]);
      }

      // Take the inverse fft to find y(n).
      yifft = math.round(math.ifft(yfft), CSMALL);

      return {
        y: yifft,
        n: ytime,
        info: infoString
      };
    },

    /**
     * Perform the deconvolution of two signals using polynomial long division.
     *
     *  Performs a deconvolution (polynomial long division) of numerator and
     * denominator.  Accepts position information.  Returns quotient, remainder,
     * and position information for each.
     *
     * Basic usage:
     *
     *     num = [1, 1, 1, 1, 1, 1];
     *     den = [1, 2, 1];
     *     qrem = deconv(num, den);
     *
     * First coefficient assumed to be associated with highest power. For example,
     * if the numerator was given as 1 + 2z^-1 + 2z^-2, then:
     *
     *     var num = [1, 2, 2];
     *
     * where, by default, the polynomials are assumed to be causal. Both indices
     * assume the first element in a list is at i = 0;
     * 
     * For non-causal polynomials, the function accepts two optional parameters:
     *
     * * nn is the position array for the numerator
     * * dn is the position array for the denominator
     *
     * Example optional usage:
     *
     * // num = z^2 + z + 1 + z^-1 + z^-2 +z^-3
     * num = [1, 1, 1, 1, 1, 1];
     * nn = range(-2, 3); // The zero index is at position 2 in num.
     * // den = z + 2 + z^-1
     * den = [1, 2, 1];
     * dn = range(-1, 1);  // The zero index is at position 1 in den.
     * qrem = deconv(num, den, nn, dn);
     *
     * Note that the sequences do not need to be the same length.
    */

    deconv: function deconv(numerator, denominator, numn, denn) {
      var num, den, dlen, nlen, ddeg, ndeg, qindex, q, qtime, rtime, r,
          infoString = 'The <em>myDeconv = deconv(numerator, denominator)</em> function returns the quotient, "q", retrieved with <em>q = getData("q", myDeconv)</em>, and the remainder "r", retrieved with <em>r = getData("r", myDeconv)</em>.  Time information is also available as "qtime" and "rtime".';

      const CSMALL = 12;

      // If a time vector hasn't been defined, define one that starts from 0 
      if (numn === undefined) {
        numn = new Array(numerator.length).fill(0).map(function (x, i) { 
          return i; 
        });
      } else {
        numn = math.number(numn);
      }
      if (denn === undefined) {
        denn = new Array(denominator.length).fill(0).map(function (x, i) { 
          return i; 
        });
      } else {
        denn = math.number(denn);
      }

      num = math.number(numerator.slice());
      den = math.number(denominator.slice());

      dlen = den.length;
      nlen = num.length;
      ddeg = dlen - 1;
      ndeg = nlen - 1;
      qindex = numn.indexOf(0) - denn.indexOf(0);

      r = num.slice();

      // Trivial solution q = 0 and remainder = num.
      if (ndeg < ddeg) {
        q = [0];
        qtime = [0];
        rtime = new Array(ndeg + 1).fill(0).map(function(x, i) { return i - numn.indexOf(0); });
      } else {
        q = new Array(ndeg - ddeg + 1);
        rtime = new Array(ndeg - ddeg + numn.indexOf(0) + 1).fill(0).map(function(x, i) { return i - numn.indexOf(0); });

        /// Perform the long division.
        for (var k = 0; k <= ndeg - ddeg; k++) {
          q[k] = r[k] / den[0];
          if (q[k] === Math.trunc(q[k])) {
            q[k] = Math.trunc(q[k]);
          }
          for (var j = k + 1; j <= ddeg + k; j++) {
            r[j] -= q[k] * den[j - k];
          }
        }
        for (var l = 0; l <= ndeg - ddeg; l++) {
          r[l] = 0;
        }
        qtime = new Array(q.length).fill(0).map(function(x, i) { return i - qindex; });
      }
      return {
        q: q,
        r: r, 
        qtime: qtime, 
        rtime: rtime,
        info: infoString
      };
    }
  }, {
    wrap: true
  });

}());