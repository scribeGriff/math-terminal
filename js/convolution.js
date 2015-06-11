/**
 * Perform linear convolution of two signals using N point circular convolution.
 *
 * Accepts position information.  Returns the convolved
 * sequence and its position information.
 *
 * Basic usage:
 *
 *     var xdata = sequence([3, 11, 7, 0, -1, 4, 2]);
 *     var hdata = sequence([2, 3, 0, -5, 2, 1]);
 *     var y = conv(xdata, hdata);
 *
 * Accepts two optional parameters:
 * * A position sequence for the xdata.
 * * A position sequence for the hdata.
 *
 * If position sequences are not provided, the data sequence is assumed
 * to start at position n = 0.  If this is not the case, a position sequence
 * can be created using the position() method of the Sequence class
 * and providing an integer indicating the n = 0 position in the sequence.
 *
 * Example optional usage:
 *
 *     var xpos = xdata.position(3);
 *     var hpos = hdata.position(1);
 *     var y = conv(xdata, hdata, xpos, hpos);
 *
 * The sequences do not need to be the same length as we are
 * computing the circular convolution of two sequences and the
 * lists are padded to length one less than the sum of their
 * lengths.
**/

/* global math: false */
/* jshint node: true, browser: true, esnext: true */

"use strict";

(function () {

  math.import({

    conv: function conv(xd, hd, xn, hn) {
      
      var xdata, hdata, xlen, hlen, yindex, ytime, yfft, xfft, hfft, yifft;
      var infoString = "Use getConvY(varName) and getConvN(varName)";

      // If a time vector hasn't been defined, define one that starts from 0 
      if (xn === undefined) xn = new Array(xd.length).fill(0).map(function (x, i) { return i; });
      if (hn === undefined) hn = new Array(hd.length).fill(0).map(function (x, i) { return i; });
      
      // Create a local copy of each list.  This is necessary
      // in case xdata and hdata are the same object.
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
      yifft = math.ifft(yfft);
      
      return {
        y: yifft,
        n: ytime,
        info: infoString
      };
    },
    // Helper functions to retrieve arrays from
    // multiple return objects.
    getConvY: function getConvY(complexObject) {
      return math.eval("y", complexObject);
    },
    getConvN: function getConvN(complexObject) {
      return math.eval("n", complexObject);
    },
    getInfo: function getInfo(complexObject) {
      return math.eval("info", complexObject);
    }
    


  } , {
    wrap: true
  });

}());