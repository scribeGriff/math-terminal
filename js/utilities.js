/* global math: false */
/* jshint node: true, browser: true, esnext: true */


"use strict";

(function () {

  math.import({
    // For functions that return multiple values, getData
    // retrieves and returns each value.
    getdata: function getdata(key, object) {
      return math.eval(key, object);
    },
    // A shortcut to retrieve the y data.
    gety: function gety(object) {
      return math.eval("y", object);
    },
    // A shortcut to retrieve the n data.
    getn: function getn(object) {
      return math.eval("n", object);
    },
    // A shortcut to retrieve the q data.
    getq: function getq(object) {
      return math.eval("q", object);
    },
    // A shortcut to retrieve the r data.
    getr: function getr(object) {
      return math.eval("r", object);
    },
    // A shortcut to retrieve the qn data.
    getqn: function getqn(object) {
      return math.eval("qn", object);
    },
    // A shortcut to retrieve the rn data.
    getrn: function getrn(object) {
      return math.eval("rn", object);
    },
    // A shortcut to retrieve the z data.
    getz: function getz(object) {
      return math.eval("z", object);
    }
  }, {
    wrap: true
  });

}());