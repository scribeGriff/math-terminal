/* global math: false, katex: false, Terminal: false, document: false, webix: false, Awesomplete: false, Highcharts: false */
/* jshint node: true, browser: true, loopfunc: true, esnext: true */

/* globals */
/* For debugging autocomplete and later perhaps as an option to disable. */
var awesomplete = true;
/* For terminal to detect if command completion should be above or below input */
var awesompleteDivUl = null;


(function () {
  "use: strict";

  var parser = new math.parser(),
      preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">',
      preerr = '<i class="prefix fa fa-angle-double-right"></i> <span class="cmderror">',
      sufans = '</span>',
      precisionVar = 8;  // default output format significant digits.

  var colors = ["#261C21", "#B0254F", "#DE4126", "#EB9605", "#3E6B48", "#CE1836", "#F85931", "#009989"],
      hccolors = ['#7cb5ec', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1', '#434348'];

  var chart = null, bgcolor, chartDiv, lineShape, points, cmdinput, autocompleter, helpExt, parseData, terminal, 
      parseDataPolar, parseDataSample, parseDataSamplen, createBaseChart, createPolarChart, createSampleChart;

  var matchThemes = /^monokai|github|xcode|obsidian|vs|arta|railcasts|chalkboard|dark$/,
      matchChartCmds = /^line.*|linepts.*|curve.*|curvepts.*|sample.*|samplen.*|polar.*|scatter.*|linlog.*|loglin.*|loglog.*|linlogpts.*|loglinpts.*|loglogpts.*|xaxis.*|yaxis.*|title.*|subtitle.*$/,
      matchWaveGenCmds = /sinewave.*|squarewave.*|sawtoothwave.*|trianglewave.*|impulse.*|step.*|gauss.*$/,
      matchMathExtensions = /fft.*|ifft.*|fsps.*|conv.*|deconv.*|corr.*|filter1d.*|length.*|addseqs.*|getdata.*|gety.*|getn.*|getq.*|getqn.*|getr.*|getrn.*|getz.*$/;

  var bgcolors = {
    monokai: "#272822",
    github: "#f8f8f8",
    xcode: "#fff",
    obsidian: "#282b2e",
    vs: "#fff",
    arta: "#222",
    railcasts: "#232323",
    chalkboard: "darkslategray",
    dark: "#040004"
  };

  Highcharts.setOptions({
    colors: hccolors,
    chart: {
      backgroundColor: 'transparent',
      plotBorderWidth: 1
    },
    title: {
      text: ' ',
      style: {
        color: '#76767A',
        font: '18px "open_sansregular", sans-serif'
      }
    },
    subtitle: {
      style: {
        color: '#76767A',
        font: '14px "open_sansregular", sans-serif'
      }
    },
    xAxis: {
      lineColor: '#76767A',
      tickColor: '#76767A',
      gridLineWidth: 1,
      gridLineDashStyle: 'dot',
      gridLineColor: '#76767A',
      gridZIndex: 0,
      offset: 10,
      endOnTick: false,
      labels: {
        y: 25,
        style: {
          color: '#76767A',
          font: '12px "open_sansregular", sans-serif'
        }
      },
      title: {
        style: {
          color: '#76767A',
          fontSize: '14px',
          fontFamily: '"open_sansregular", sans-serif'

        }
      }
    },
    yAxis: {
      gridLineDashStyle: 'dot',
      gridLineColor: '#76767A',
      gridZIndex: 0,
      lineColor: '#76767A',
      lineWidth: 1,
      offset: 10,
      tickWidth: 1,
      tickColor: '#76767A',
      labels: {
        style: {
          color: '#76767A',
          font: '12px "open_sansregular", sans-serif'
        }
      },
      title: {
        text: ' ',
        style: {
          color: '#76767A',
          fontSize: '14px',
          fontFamily: '"open_sansregular", sans-serif'
        }
      }
    },
    navigation: {
      buttonOptions: {
        align: 'right',
        verticalAlign: 'bottom'
      }
    },
    legend: {
      itemStyle: {
        color: '#76767A',
        font: '12px "open_sansregular", sans-serif',
      },
      itemHoverStyle: {
        color: '#7cb5ec'
      },
      itemHiddenStyle: {
        color: '#555'
      },
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'top',
    },
    credits: {
      enabled: false
    },
    labels: {
      style: {
        color: '#3E576F'
      }
    }
  });

  var helpinfo = [
    '<table class="ink-table">',
    '<tr><td>clear</td><td class="answer">clears command window</td></tr>',
    '<tr><td>clear vars</td><td class="answer">clears workspace variables</td></tr>',
    '<tr><td>clear all</td><td class="answer">clears window and variables</td></tr>',
    '<tr><td>clear chart</td><td class="answer">clears current chart</td></tr>',
    '<tr><td>help</td><td class="answer">displays this help screen</td></tr>',
    '<tr><td>help <em>command</em></td><td class="answer">displays the <em>command</em> documentation</td></tr>',
    '<tr><td>line <em>[data]</em></td><td class="answer">creates a line chart and plots the <em>[data]</em>.  See also help for curve, linepts, curvepts, polar, sample, samplen, linlog, loglin, loglog</td></tr>',
    '<tr><td>precision</td><td class="answer">displays number of significant digits in formatted answer</td></tr>',
    '<tr><td>precision  <em>value</em></td><td class="answer">set precision of answer to <em>[0 - 16]</em> significant digits</td></tr>',
    '<tr><td>theme</td><td class="answer">displays current theme</td></tr>',
    '<tr><td>theme <em>name</em></td><td class="answer">change to theme <em>name</em> (monokai, github, xcode, obsidian, vs, arta, railcasts, chalkboard, dark)</td></tr>',
    '</table>'
  ].join('');

  window.onload = function() {
    if (awesomplete) {
      cmdinput = document.getElementById("autocomp");
      autocompleter = new Awesomplete(cmdinput, {
        autoFirst: true, 
        filter: function(text, input) {
          var matchInput = input.match(/\b\w{2,}\b$/);
          if (matchInput !== null) {
            return Awesomplete.FILTER_CONTAINS(text, matchInput[0]);
          }
        },
        replace: function(text) {
          var before = this.input.value.match(/^.+ \s*|/)[0];
          this.input.value = before + text;
        }	
      });
      // Awesomplete was clobbering the autofocus attribute in FF so fix was to focus in JS.
      cmdinput.focus();

      /* Reference : http://docs.webix.com/helpers__ajax_operations.html */
      webix.ajax("data/aclist.json").then(function(aclist) {
        autocompleter.list = aclist.json();
      });

      webix.ajax("data/helpext.json").then(function(helpext) {
        helpExt = helpext.json();
      });

      awesompleteDivUl = document.querySelector('div.awesomplete > ul');

      chartDiv = document.getElementById('chart-div');
    }
  };

  // Set default data type for mathjs to 'array' to be compatible with vanilla js.
  math.config({
    matrix: 'array'
  });

  // Convert the 'terminal' DOM element into a live terminal.
  // This example defines several custom commands for the terminal.
  terminal = new Terminal('terminal', {}, {
    execute: function(cmd, args) {
      var cmds = {
        clear: function clear() {
          if (args && args[0]) {
            if (args.length > 1) {
              return preerr + 'Too many arguments' + sufans;
            }
            else if (args[0] === 'vars') {
              parser.clear();
              return preans + 'Cleared workspace variables.' + sufans;
            } else if (args[0] === 'all') {
              parser.clear();
              terminal.clear();
              terminal.clearWelcome();
              if (chart) {
                chart.destroy();
              }
              return '';
            } else if (args[0] === 'chart') {
              if (chart) {
                chart.destroy();
              }
              return '';
            } else {
              return preerr + 'Invalid clear argument' + sufans;
            }
          }
          terminal.clear();
          terminal.clearWelcome();
          return '';
        },

        help: function help() {
          if (args && args[0]) {
            if (args.length > 1) {
              return preerr + 'Too many arguments' + sufans;
            } else if (args[0].match(matchChartCmds) || args[0].match(matchWaveGenCmds) || args[0].match(matchMathExtensions)) {
              return preans + helpExt[args[0]] + sufans;
            } else {
              try {
                var helpStr = math.help(args[0]).toString();
                return preans + helpStr + sufans + '<br>' + preans + '<a href="http://mathjs.org/docs/reference/functions/' + args[0] + '.html" target="_blank">' + args[0] + ' docs at mathjs.org</a>' + sufans;
              } catch(error) {
                // Unknown command.
                return preerr + 'Unknown command: ' + args[0] + sufans;
              }
            }
          }
          return helpinfo;
        },

        theme: function theme() {
          if (args && args[0]) {
            if (args.length > 1) {
              return preerr + 'Too many arguments' + sufans;
            } else if (args[0].match(matchThemes)) { 
              terminal.setTheme(args[0]);
              return ''; 
            } else {
              return preerr + 'Invalid theme' + sufans;
            }
          }
          return preans + terminal.getTheme() + sufans;
        },

        precision: function precision() {
          if (args && args[0]) {
            if (args.length > 1) {
              return preerr + 'Too many arguments' + sufans;
            } else if (args[0].match(/^([0-9]|1[0-6])$/)) { 
              precisionVar = parseInt(args[0]);
              return ''; 
            } else {
              return preerr + 'Invalid precision value' + sufans;
            }
          }
          return preans + precisionVar + sufans;
        },

        ver: function ver() {
          return math.version;
        },

        version: function version() {
          return math.version;
        },

        curve: function curve() {
          var dataSeries,
              argVal,
              options = {
                type: 'spline',
                enableMarkers: false
              };

          if (args.length === 0) {
            return preerr + 'The curve chart needs to know what data to plot.  Please see <em>help curve</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The curve chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help curve</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The curve chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help curve</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        line: function line() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: false
              };
          if (args.length === 0) {
            return preerr + 'The line chart needs to know what data to plot.  Please see <em>help line</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The line chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help line</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The line chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help line</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        curvepts: function curvepts() {
          var dataSeries,
              argVal,
              options = {
                type: 'spline',
                enableMarkers: true
              };
          if (args.length === 0) {
            return preerr + 'The curvepts chart needs to know what data to plot.  Please see <em>help curvepts</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The curvepts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help curvepts</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The curvepts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help curvepts</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        linepts: function linepts() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: true
              };
          if (args.length === 0) {
            return preerr + 'The linepts chart needs to know what data to plot.  Please see <em>help linepts</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The linepts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help linepts</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The linepts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help linepts</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        scatter: function scatter() {
          var dataSeries,
              argVal,
              options = {
                type: 'line',
                zoomDir: 'xy',
                enableMarkers: true,
                xEndOnTic: true,
                xStartOnTic: true,
                scatterOps: {
                  marker: {
                    radius: 5,
                    states: {
                      hover: {
                        lineColor: 'rgb(100,100,100)'
                      }
                    }
                  },
                  states: {
                    hover: {
                      marker: {
                        enabled: false
                      }
                    }
                  }
                }
              };

          if (args.length === 0) {
            return preerr + 'The scatter chart needs to know what data to plot.  Please see <em>help scatter</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The scatter chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help scatter</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The scatter chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help scatter</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        linlog: function linlog() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: false,
                ymTickInterval: 0.1,
                yType: 'logarithmic'
              };
          if (arguments.length === 0) {
            return preerr + 'The linlog chart needs to know what data to plot.  Please see <em>help linlog</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The linlog chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help linlog</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The linlog chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help linlog</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        loglin: function loglin() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: false,
                xmTickInterval: 0.1,
                xType: 'logarithmic'
              };
          if (arguments.length === 0) {
            return preerr + 'The loglin chart needs to know what data to plot.  Please see <em>help loglin</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The loglin chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglin</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The loglin chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglin</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        loglog: function loglog() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: false,
                xmTickInterval: 0.1,
                xType: 'logarithmic',
                ymTickInterval: 0.1,
                yType: 'logarithmic'
              };
          if (arguments.length === 0) {
            return preerr + 'The loglog chart needs to know what data to plot.  Please see <em>help loglog</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The loglog chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglog</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The loglog chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglog</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        linlogpts: function linlogpts() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: true,
                ymTickInterval: 0.1,
                yType: 'logarithmic'
              };
          if (arguments.length === 0) {
            return preerr + 'The linlogpts chart needs to know what data to plot.  Please see <em>help linlogpts</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The linlogpts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help linlogpts</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The linlogpts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help linlogpts</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        loglinpts: function loglinpts() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: true,
                xmTickInterval: 0.1,
                xType: 'logarithmic'
              };
          if (arguments.length === 0) {
            return preerr + 'The loglinpts chart needs to know what data to plot.  Please see <em>help loglinpts</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The loglinpts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglinpts</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The loglinpts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglinpts</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        loglogpts: function loglogpts() {
          var dataSeries,
              argVal,
              options = {
                enableMarkers: true,
                xmTickInterval: 0.1,
                xType: 'logarithmic',
                ymTickInterval: 0.1,
                yType: 'logarithmic'
              };
          if (arguments.length === 0) {
            return preerr + 'The loglogpts chart needs to know what data to plot.  Please see <em>help loglogpts</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < args.length; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The loglogpts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglogpts</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args);
              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The loglogpts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglogpts</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div and with the required options.
          chart = createBaseChart(chartDiv, dataSeries, options);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        // Draws a polar plot.
        polar: function polar() {
          var dataSeries, 
              argVal,
              argsLen = args.length;

          if (argsLen === 0) {
            return preerr + 'The polar chart needs to know what data to plot.  Please see <em>help polar</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < argsLen; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The polar chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help polar</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseDataPolar.apply(null, args);

              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The polar chart requires data to be submitted as [x1] [x1] [x3] etc.  Please see <em>help polar</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div.
          chart = createPolarChart(chartDiv, dataSeries);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        // Draws a stem chart using bar and points.
        // Does not accept time information.  All samples start at n = 0.
        // See samplen() for sample plot that takes time information.
        sample: function sample() {
          var dataSeries = [],
              argVal,
              argsLen = args.length;

          if (argsLen === 0) {
            return preerr + 'The sample chart needs to know what data to plot.  Please see <em>help sample</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < argsLen; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The sample chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help sample</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseDataSample.apply(null, args);

              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The sample chart requires data to be submitted as [x1] [x2] [x3] etc.  Please see <em>help sample</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          // Recommended by Highcharts for memory management.
          if (chart) chart.destroy();

          // Chart the data in the correct div.
          chart = createSampleChart(chartDiv, dataSeries);

          // If all went well, just return an empty string to the terminal.
          return '';
        },

        // Like sample plot, but accepts timing information.
        samplen: function samplen() {
          var dataSeries = [],
              argVal,
              argsLen = args.length;

          if (argsLen === 0) {
            return preerr + 'The samplen chart needs to know what data to plot.  Please see <em>help samplen</em> for more information.' + sufans;
          } else {
            // Try to parse the data and format it for plotting.
            try {
              // Check if argument is a terminal variable by trying to retrieve the value.
              for (var i = 0; i < argsLen; i++) {
                argVal = parser.eval(args[i]);
                if (typeof argVal != 'undefined') {
                  args[i] = argVal;
                }
                if (math.typeof(args[i]) === 'Matrix') {
                  args[i] = JSON.parse(args[i]);
                }
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.every(elem => Array.isArray(elem))) {
                throw new Error('The samplen chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help samplen</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseDataSamplen.apply(null, args);

              // Catch any errors.
            } catch(error) {
              // This usually means the data was passed without using pairs of arrays for x and y values.
              if (error.name.toString() == "TypeError") {
                return preerr + error.name + ': The samplen chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help samplen</em> for more information.' + sufans;
              }
              // Some other kind of error has occurred.
              return preerr + 'There seems to be an issue with the data. ' + error + sufans; 
            }
          }

          if (chart) chart.destroy();

          chart = createSampleChart(chartDiv, dataSeries);

          return '';
        },

        // Adds an x axis label
        xaxis: function xaxis() {
          if (args.length === 0) {
            return preerr + 'The xaxis command adds a label to the x axis of a chart.  Please see <em>help xaxis</em> for more information.' + sufans;
          } else {
            if (chart) {
              try {
                chart.xAxis[0].setTitle({
                  text: args[0],
                });
              } catch(error) {
                return preerr + 'The label for the x axis seems to be improperly formatted.  Please see <em>help xaxis</em> for more information.' + sufans;
              }
            }
            return '';
          }
        },

        // Adds a y axis label
        yaxis: function yaxis() {
          if (args.length === 0) {
            return preerr + 'The yaxis command adds a label to the y axis of a chart.  Please see <em>help yaxis</em> for more information.' + sufans;
          } else {
            if (chart) {
              try {
                chart.yAxis[0].setTitle({
                  text: args[0]
                });
              } catch(error) {
                return preerr + 'The label for the y axis seems to be improperly formatted.  Please see <em>help yaxis</em> for more information.' + sufans;
              }
            }
            return '';
          }
        },

        // Adds a chart title
        title: function title() {
          if (args.length === 0) {
            return preerr + 'The title command adds a title to a chart if one exists.  Please see <em>help title</em> for more information.' + sufans;
          } else {
            if (chart) {
              try {
                chart.setTitle({
                  text: args[0]
                });
                if (args[1] !== null) {
                  chart.setTitle({
                    style: { 
                      color: args[1] 
                    } 
                  });
                }
              } catch(error) {
                return preerr + 'The text label or color for the title command seems to be improperly formatted.  Please see <em>help title</em> for more information.' + sufans;
              }
            }
            return '';
          }
        },

        // Adds a chart subtitle
        subtitle: function subtitle() {
          if (args.length === 0) {
            return preerr + 'The subtitle command adds a subtitle to a chart if one exists.  Please see <em>help subtitle</em> for more information.' + sufans;
          } else {
            if (chart) {
              try {
                chart.setTitle(null, {
                  text: args[0]
                });
                if (args[1] !== null) {
                  chart.setTitle(null, {
                    style: { 
                      color: args[1] 
                    } 
                  });
                }
              } catch(error) {
                return preerr + 'The text label or color for the subtitle command seems to be improperly formatted.  Please see <em>help subtitle</em> for more information.' + sufans;
              }
            }
            return '';
          }
        }
      };

      if (typeof cmds[cmd] !== 'function') {
        var result, katstr, formres;
        // Check for valid Math.js command.
        try {
          result = parser.eval(cmd);
        } catch(error) {
          // Unknown command.
          return false;
        }
        if (cmd.match(/[;]$/)) {
          // Suppress the empty array symbol if line ends in a ;
          return '';
        } else {
          // Check for Katex format of solution.
          try {
            formres = math.format(result, precisionVar);
            katstr = katex.renderToString(formres);
            return preans + katstr + sufans;
          } catch(error) {
            return preans + formres + sufans;
          }
        }
      }
      return cmds[cmd]();
    }
  });

  parseData = function parseData(args) {
    var dataSeries = [],
        buffer,
        ydata,
        dataObj,
        count,
        argsLen = arguments.length;

    if (argsLen === 1) {
      // use the default x vector
      ydata = new Array(arguments[0].length);
      for (var j = 0; j < arguments[0].length; j++) {
        ydata[j] = parseFloat(arguments[0][j]);
      }
      dataObj = {
        cropThreshold: 600,
        name: 'set 1',
        data: ydata
      };
      dataSeries.push(dataObj);
    } else {
      // will need to create x,y pairs
      count = 1;
      for (var k = 0; k < argsLen; k += 2) {
        ydata = new Array(arguments[k].length);
        for (var l = 0; l < arguments[k].length; l++) {
          buffer = new Array(2);
          buffer[0] = parseFloat(arguments[k][l]);
          if (l >= arguments[k + 1].length) {
            buffer[1] = null;
          } else {
            buffer[1] = parseFloat(arguments[k + 1][l]);
          }

          ydata[l] = buffer;
        }
        dataObj = {
          cropThreshold: 600,
          name: 'set ' + count++,
          data: ydata
        };
        dataSeries.push(dataObj);
      }
    }
    return dataSeries;
  };

  parseDataPolar = function parseDataPolar(args) {
    var dataSeries = [],
        argsLen = arguments.length,
        argsZeroLen = arguments[0].length,
        ydata,
        dataObj,
        count = 1;

    for (var k = 0; k < argsLen; k++) {
      ydata = new Array(argsZeroLen);
      for (var l = 0; l < argsZeroLen; l++) {
        ydata[l] = parseFloat(arguments[k][l]);
      }
      // drop the last point since in polar charts 0 and 2pi
      // should overlap.
      // TODO: consider cases where this is not valid.
      ydata.splice(-1,1);

      dataObj = {
        type: 'line',
        name: 'set' + count++,
        data: ydata,
        dashStyle: 'LongDash'
      };

      dataSeries.push(dataObj);
    }
    return dataSeries;
  };

  parseDataSample = function parseDataSample(args) {
    var dataSeries = [],
        argsLen = arguments.length,
        argsZeroLen = arguments[0].length,
        ydata,
        dataObj,
        count = 1;

    for (var k = 0; k < argsLen; k++) {
      ydata = new Array(arguments[k].length);
      for (var l = 0; l < arguments[k].length; l++) {
        ydata[l] = parseFloat(arguments[k][l]);
      }

      dataObj = [{
        type: 'column',
        cropThreshold: 600,
        name: 'set ' + count++,
        data: ydata,
        color: hccolors[k]
      }, {
        type: 'scatter',
        cropThreshold: 600,
        data: ydata,
        name: 'sample data',
        linkedTo: ':previous',
        marker: {
          symbol: 'circle',
          lineWidth: 2,
          lineColor: hccolors[k],
          fillColor: 'transparent'
        }
      }];
      Array.prototype.push.apply(dataSeries, dataObj);
    }

    return dataSeries;
  };

  parseDataSamplen = function parseDataSamplen(args) {
    var dataSeries = [],
        argsLen = arguments.length,
        argsZeroLen = arguments[0].length,
        buffer,
        ydata,
        dataObj,
        count = 1;

    if (argsLen === 1) {
      ydata = new Array(arguments[0].length);
      for (var j = 0; j < arguments[0].length; j++) {
        ydata[j] = parseFloat(arguments[0][j]);
      }

      dataObj = [{
        type: 'column',
        cropThreshold: 600,
        name: 'set ' + 1,
        data: ydata,
        color: hccolors[0]
      }, {
        type: 'scatter',
        cropThreshold: 600,
        data: ydata,
        name: 'sample data',
        linkedTo: ':previous',
        marker: {
          symbol: 'circle',
          lineWidth: 2,
          lineColor: hccolors[0],
          fillColor: 'transparent'
        }
      }];
      Array.prototype.push.apply(dataSeries, dataObj);
    } else {
      // need to generate n,y pairs
      count = 1;
      for (var k = 0; k < argsLen; k += 2) {
        ydata = new Array(arguments[k].length);
        for (var l = 0; l < arguments[k].length; l++) {
          buffer = new Array(2);
          buffer[0] = parseFloat(arguments[k][l]);
          if (l >= arguments[k + 1].length) {
            buffer[1] = null;
          } else {
            buffer[1] = parseFloat(arguments[k + 1][l]);
          }

          ydata[l] = buffer;
        }
        dataObj = [{
          type: 'column',
          cropThreshold: 600,
          name: 'set ' + count++,
          data: ydata,
          color: hccolors[k]
        }, {
          type: 'scatter',
          cropThreshold: 600,
          data: ydata,
          name: 'sample data',
          linkedTo: ':previous',
          marker: {
            symbol: 'circle',
            lineWidth: 2,
            lineColor: hccolors[k],
            fillColor: 'transparent'
          }
        }];
        Array.prototype.push.apply(dataSeries, dataObj);
      }
    }

    return dataSeries;
  };

  createBaseChart = function createBaseChart(container, chartData, uoptions) {

    var defaults = {
      type: 'line',
      zoomDir: 'x',
      scatterOps: {},
      enableMarkers: false,
      xEndOnTic: false,
      xStartOnTic: false,
      xmTickInterval: null,
      xType: 'linear',
      ymTickInterval: null,
      yType: 'linear'
    };

    var options = uoptions || defaults;
    options.type = options.type || defaults.type;
    options.enableMarkers = options.enableMarkers || defaults.enableMarkers;
    options.zoomDir = options.zoomDir || defaults.zoomDir;
    options.scatterOps = options.scatterOps || defaults.scatterOps;
    options.xEndOnTic = options.xEndOnTic || defaults.xEndOnTic;
    options.xStartOnTic = options.xStartOnTic || defaults.xStartOnTic;
    options.xmTickInterval = options.xmTickInterval || defaults.xmTickInterval;
    options.xType = options.xType || defaults.xType;
    options.ymTickInterval = options.ymTickInterval || defaults.ymTickInterval;
    options.yType = options.yType || defaults.yType;

    return Highcharts.chart(container, {
      chart: {
        type: options.type,
        zoomType: options.zoomDir,
        panning: true,
        panKey: 'shift'
      },
      plotOptions: {
        series: {
          marker: {
            enabled: options.enableMarkers,
            connectNulls: true
          }
        },
        scatter: options.scatterOps
      },
      xAxis: {
        endOnTic: options.xEndOnTic,
        startOnTic: options.xStartOnTic,
        type: options.xType,
        minorTickInterval: options.xmTickInterval
      },
      yAxis: {
        type: options.yType,
        minorTickInterval: options.ymTickInterval
      },
      tooltip: {
        valueDecimals: 6,
        shared: true,
      },
      series: chartData
    });
  };

  createPolarChart = function createPolarChart(container, chartData) {

    var interval = 360 / chartData[0].data.length;

    return Highcharts.chart(chartDiv, {
      chart: {
        polar: true,
        plotBorderWidth: 0
      },
      pane: {
        startAngle: 0,
        endAngle: 360
      },
      xAxis: {
        tickInterval: 30,
        offset: 0,
        min: 0,
        max: 360,
        labels: {
          formatter: function () {
            return this.value + '°';
          },
          step: 3,
          y: null
        }
      },
      yAxis: {
        min: 0,
        offset: 0
      },
      plotOptions: {
        series: {
          pointStart: 0,
          pointInterval: interval,
          marker: {
            enabled: false
          }
        },
        column: {
          pointPadding: 0,
          groupPadding: 0
        }
      },
      tooltip: {
        valueDecimals: 6,
        shared: true,
      },
      series: chartData
    });
  };

  createSampleChart = function createSampleChart(container, chartData) {

    return Highcharts.chart(container, {
      chart: {
        zoomType: 'x',
        panning: true,
        panKey: 'shift'
      },
      tooltip: {
        valueDecimals: 6,
        shared: true,
      },
      plotOptions: {
        column: {
          grouping: false,
          shadow: false,
          borderWidth: 0
        },
        series: {
          pointWidth: 3,
          stickyTracking: false,
          states: {
            hover: {
              enabled: false
            }
          }
        }
      },
      yAxis: {
        plotLines: [{
          color: '#76767A',
          width: 2,
          value: 0,
          zIndex: 5
        }]
      },
      series: chartData
    });
  };

}());