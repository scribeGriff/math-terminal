/* global math: false */
/* jshint node: true, browser: true, esnext: true */

"use strict";

(function () {

  math.import({

    sine: function sine(peak, period, size) {
      var samples = new Array(441);
      var frequency = 440;                      // 440 Hz = "A" note
      var samples_length = 441;               // Plays for 1 second (44.1 KHz)
      for (var i=0; i < samples_length ; i++) { // fills array with samples
        var t = i/samples_length;               // time from 0 to 1
        samples[i] = Math.sin( frequency * 2*Math.PI*t ); // wave equation (between -1,+1)
        samples[i] *= (1-t);                    // "fade" effect (from 1 to 0)
      }
      return samples;
    }

  });

}());