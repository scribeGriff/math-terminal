/* global math: false */
/* jshint node: true, browser: true */

"use strict";

(function () {

  var radix2, dft;

  math.import({
    // Computes the fft of an array of arbitrary length.
    fft: function fft(redata, imdata, N) {
      var _redata, _imdata, _n, len;
      len = redata.length;
      if (N !== undefined && N !== len) {
        _n = N;
        if (N > len) {
          _redata = redata.fill(0, len - 1, N -1);
        _imdata = imdata !== undefined ? imdata.fill(0, len - 1, N -1) : new Array(len).fill(0);
        } else {
          _redata = redata.slice(0, N);
        _imdata = imdata !== undefined ? imdata.slice(0, N) : new Array(len).fill(0);
        }
      } else {
        _n = len;
        _redata = redata;
        _imdata = imdata !== undefined ? imdata : new Array(len).fill(0);
      }
      if ((N & -N) == N) {
        // If true, use O(nlogn) algorithm,
        radix2(_redata, _imdata);
      } else {
        // else use O(n^2) algorithm.
        dft(_redata, _imdata);
      }
      return _imdata;
    }
  }, {
    wrap: true
  });

  radix2 = function radix2(_redata, _imdata) {
    return;
  };

  dft = function dft(_redata, _imdata) {
    return;
  };

}());
