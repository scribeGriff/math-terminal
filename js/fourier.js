/* global math: false */
/* jshint node: true, browser: true, esnext: true */

"use strict";

(function () {

  var radix2, dft, iradix2, idft, formatData;

  math.import({
    /**
     * Computes the FFT of an array of arbitrary length.
     * @param   {Array}  redata real data or complex data
     * @param   {Array}  imdata imaginary data (optional)
     * @param   {Number} N      Order of FFT (optional)
     * @returns {Array}  FFT of input data as a complex array.
     */
    fft: function fft(redata, imdata, N) {
      var _n, _cxdata;

      _cxdata = formatData(redata, imdata, N);
      _n = _cxdata.length;

      if ((_n & -_n) === _n) {
        // If true, use O(nlogn) algorithm,
        return radix2(_cxdata);
      } else {
        // else use O(n^2) algorithm.
        return dft(_cxdata);
      }
    },
    /**
     * Computes the inverse FFT of an array of arbitrary length.
     * @param   {Array}  redata real data or complex data
     * @param   {Array}  imdata imaginary data (optional)
     * @param   {Number} N      order of IFFT (optional)
     * @returns {Array}  IFFT of input data as a complex array
     */
    ifft: function ifft(redata, imdata, N) {
      var _n, _cxdata;

      _cxdata = formatData(redata, imdata, N);
      _n = _cxdata.length;

      if ((_n & -_n) === _n) {
        // If true, use O(nlogn) algorithm,
        return iradix2(_cxdata);
      } else {
        // else use O(n^2) algorithm.
        return idft(_cxdata);
      }
    }
  }, {
    wrap: true
  });

  /**
   * Formats the input data for FFT/IFFT
   * @param   {Array}  redata real data or complex data
   * @param   {Array}  imdata imaginary data
   * @param   {Number} N      optional: number of points of FFT/IFFT
   * @returns {Array}  Array of complex numbers representing input data
   */
  formatData = function formatData(redata, imdata, N) {
    var len, _redata, _imdata, _n, _cxdata;
    len = redata.length;

    if (typeof redata[0] === 'number') {
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

      // Generate a complex array from real and imaginary data.
      _cxdata = new Array(_n);
      for (var i = 0; i < _n; i++) {
        _cxdata[i] = (math.complex(_redata[i], _imdata[i]));
      }
    } else {
      // Assume redata is already complex.
      // TODO:  What to do about imdata and N?
      _n = len;
      _cxdata = redata;
    }
    return _cxdata; 
  };

  /**
   * Performs an O(nlogn) radix2 fft on the input data.
   * @param   {Array} _data complex array for FFT calculation
   * @returns {Array} transformed version of _data
   */
  radix2 = function radix2(_data) {
    var _n = _data.length;
    if (_n === 1) return _data;

    // Perform fft of even terms recursively.
    var even = new Array(_n >> 1);
    for (var ke = 0; ke < _n/2; ke++) {
      even[ke] = _data[2 * ke];
    }
    var q = radix2(even);

    // Perform fft of odd terms recursively.
    var odd = new Array(_n >> 1);
    for (var ko = 0; ko < _n/2; ko++) {
      odd[ko] = _data[2 * ko + 1];
    }
    var r = radix2(odd);

    // Merging formula for combining 2 N/2-point DFTs
    // into one N-point DFT.
    var y = new Array(_n);
    for (var k = 0; k < _n/2; k++) {
      var kth = -2 * k * math.PI / _n;
      var wk = math.complex(math.cos(kth), math.sin(kth));
      y[k] = math.add(q[k], (math.multiply(wk, r[k])));
      y[k + (_n >> 1)] = math.subtract(q[k], (math.multiply(wk, r[k])));
    }
    return y;
  };

  /**
   * Performs a "brute force" discrete fourier transform of the input data as 
   * given by the expression: X(k) = sumN [x(n) * WN(nk)]
   * @param   {Array} _data complex array for DFT calculation
   * @returns {Array} transformed version of _data
   */
  dft = function dft(_data) {
    var _n = _data.length;
    var y = new Array(_n);
    for (var k = 0; k < _n; k++) {
      var q = math.complex(0, 0);
      for (var j = 0; j < _n; j++) {
        var kth = -2 * k * j * math.PI / _n;
        var wk = math.complex(math.cos(kth), math.sin(kth));
        q = math.add(q, (math.multiply(wk, _data[j])));
      }
      y[k] = q;
    }
    return y;
  };

  /**
   * Performs an O(nlogn) radix2 inverse FFT on the input data.
   * @param   {Array} _data complex array for IFFT calculation
   * @returns {Array} inverse transformed version of _data
   */
  iradix2 = function iradix2(_data) {
    var _n = _data.length;
    var x = new Array(_n);
    // Take the conjugate of the input data.
    for (var i = 0; i < _n; i++) {
      x[i] = math.conj(_data[i]);
    }

    // Compute an FFT of the conjugated data.
    var y = math.fft(x);

    // Take the conjugate again of the transformed data and scale by 1/N.
    for (var j = 0; j < _n; j++) {
      y[j] = math.multiply(math.conj(y[j]), 1 / _n);
    }
    return y;
  };

  /**
   * Performs a "brute force" discrete inverse fourier transform of the input data 
   * as given by the expression: x(n) = 1/N * sum(k)[X(k) * WN(-nk)]
   * @param   {Array} _data complex array for IFFT calculation
   * @returns {Array} inverse transformed version of _data
   */
  idft = function idft(_data) {
    var _n = _data.length;
    var y = new Array(_n);
    for (var k = 0; k < _n; k++) {
      var q = math.complex(0, 0);
      for (var j = 0; j < _n; j++) {
        var kth = 2 * k * j * math.PI / _n;
        var wk = math.complex(math.cos(kth), math.sin(kth));
        q = math.add(q, (math.multiply(wk, _data[j])));
      }
      y[k] = math.multiply(q, 1 / _n);
    }
    return y;
  };

}());
