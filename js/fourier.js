/* global math: false */
/* jshint node: true, browser: true, esnext: true */

"use strict";

(function () {

  var radix2, dft;

  math.import({
    // Computes the fft of an array of arbitrary length.
    fft: function fft(redata, imdata, N) {
      var len, _redata, _imdata, _n, _cxdata;
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
      
      // Generate a complex array from real and imaginary data.
      _cxdata = new Array(_n);
      for (var i = 0; i < _n; i++) {
        _cxdata[i] = (math.complex(_redata[i], _imdata[i]));
      }
        
      if ((_n & -_n) === _n) {
        // If true, use O(nlogn) algorithm,
        //return radix2(_cxdata);
      } else {
        // else use O(n^2) algorithm.
        //return dft(_cxdata);
      }
      return _cxdata;
    }
  }, {
    wrap: true
  });

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

}());
