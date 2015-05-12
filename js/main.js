/* global math: false, katex: false, Terminal: false, document: false, vis: false, webix: false, Awesomplete: false */
/* jshint node: true, browser: true */

/* globals */
/* For debugging autocomplete and later perhaps as an option to disable. */
var awesomplete = true;
/* Detect when autocomplete menu is open to prevent terminal behavior on Enter key. */
var acIsOpen = false;

(function () {
  "use: strict";

  var parser = new math.parser();
  var preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">';
  var preerr = '<i class="prefix fa fa-angle-double-right"></i> <span class="cmderr">';
  var sufans = '</span>';
  var precision = 8;  // default output format significant digits.
  var colors = ["#261C21", "#B0254F", "#DE4126", "#EB9605", "#261C21", "#3E6B48", "#CE1836", "#F85931", "#009989"];
  var chart = null;
  var points, cmdinput, autocompleter;
  var parseData, createChart, terminal;

  var matchThemes = /^monokai|github|xcode|obsidian|vs|arta|railcasts|chalkboard|dark$/;
  var matchChartCmds = /^line.*|linepts.*|curve.*|curvepts.*|xaxis.*|yaxis.*$/;
  var matchWaveGenCmds = /sine.*$/;

  var helpinfo = [
    '<table class="ink-table">',
    '<tr><td>clear</td><td class="answer">clears command window</td></tr>',
    '<tr><td>clear vars</td><td class="answer">clears workspace variables</td></tr>',
    '<tr><td>clear all</td><td class="answer">clears window and variables</td></tr>',
    '<tr><td>clear chart</td><td class="answer">clears current chart</td></tr>',
    '<tr><td>help</td><td class="answer">displays this help screen</td></tr>',
    '<tr><td>help <em>command</em></td><td class="answer">displays Math.js <em>command</em> documentation</td></tr>',
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
    }
  };

  // Configures Math.js to use big numbers as the default number.
  math.config({
    number: 'bignumber'  // Default type of number: 'number' (default) or 'bignumber'
  });

  // Import chart commands to mathjs.
  math.import({
    // Draws a curve through each data point but doesn't draw specific points.
    curve: function(args) {
      points = false;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "spline", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Draws a line to each data point but doesn't draw specific points.
    line: function(args) {
      points = false;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "line", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Draws a curve through each data point and draws specific points.
    curvepts: function(args) {
      points = true;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "spline", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Draws a line through each data point and draws specific points.
    linepts: function(args) {
      points = true;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "line", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    xaxis: function(xaxisTitle) {
      if (chart) {
        chart.config.xAxis.title = xaxisTitle;
        chart.refresh();
      }
    },
    yaxis: function(yaxisTitle) {
      if (chart) {
        chart.config.yAxis.title = yaxisTitle;
        chart.refresh();
      }
    }

  });

  // Convert the 'terminal' DOM element into a live terminal.
  // This example defines several custom commands for the terminal.
  terminal = new Terminal('terminal', {}, {
    execute: function(cmd, args) {
      switch (cmd) {
        case 'clear':
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
              if (chart) chart.destructor();
              return '';
            } else if (args[0] === 'chart') {
              if (chart) chart.destructor();
              return '';
            } else {
              return preerr + 'Invalid clear argument' + sufans;
            }
          }
          terminal.clear();
          return '';

        case 'help':
          if (args && args[0]) {
            if (args.length > 1) {
              return preerr + 'Too many arguments' + sufans;
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

        case 'theme':
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

        case 'precision':
          if (args && args[0]) {
            if (args.length > 1) {
              return preerr + 'Too many arguments' + sufans;
            } else if (args[0].match(/^([0-9]|1[0-6])$/)) { 
              precision = parseInt(args[0]);
              return ''; 
            } else {
              return preerr + 'Invalid precision value' + sufans;
            }
          }
          return preans + precision + sufans;

        case 'ver':
        case 'version':
          return '1.0.0';

        default:
          var result, katstr, formres;
          // Check for valid Math.js command.
          try {
            result = parser.eval(cmd);
          } catch(error) {
            // Unknown command.
            return false;
          }
          if (cmd.match(matchChartCmds)) {
            // Generate chart but don't return any result for now.
            return '';
          } else if (cmd.match(/[;]$/)) {
            // Suppress the empty array symbol if line ends in a ;
            return '';
          } else if (cmd.match(matchWaveGenCmds)) {
            return 'generated waveform';
          } else {
            // Check for Katex format of solution.
            try {
              formres = math.format(result, precision);
              katstr = katex.renderToString(formres);
              return preans + katstr + sufans;
            } catch(error) {
              return preans + formres + sufans;
            }
          }
      }
    }
  });

  // Parse the data for the various chart functions.
  parseData = function parseData(args) {
    console.time("data parsing time");
    var lenj = arguments[0]._data.length,
        lenk = arguments.length,
        data = new Array(lenj),
        buffer;
    for (var j = 0; j < lenj; j++) {
      buffer = new Array(lenk);
      for (var k = 0; k < lenk; k++) {
        if (j >= arguments[k]._data.length) {
          buffer[k] = null;
        } else {
          buffer[k] = arguments[k]._data[j];
        }
      }
      data[j] = buffer;
    }
    console.timeEnd("data parsing time");
    return data;
  };

  // Creates a chart from the provided data and specified type.
  createChart = function createChart(data, type, usePoints) {
    console.time("chart creation time");
    var itemRadius = usePoints ? 4 : 0;

    var chartProto = webix.ui({
      id: "lineChart",
      view: "chart",
      data: data,
      datatype: "jsarray",
      container: "chart-div",
      type: type,
      value: "#data1#",
      item: {
        color: colors[1],
        radius: itemRadius
      },
      line: {
        color: colors[1],
        width: 3
      },
      radius: 0,
      border: true,
      xAxis: {
        template: function(obj){
          return (obj.data0 % 20 ? "" : obj.data0);
        },
        lines: function(obj){
          return (obj.data0 % 20 ? false:true);
        }
      },
      yAxis: {}
    });

    if (data.length > 2) {
      for (var i = 2, len = data.length; i < len; i++) {
        chartProto.addSeries({
          value: "#data" + i + "#",
          item: {
            color: colors[i],
            radius: itemRadius
          },
          line: {
            color: colors[i],
            width: 3
          }
        });
      }
    }
    console.timeEnd("chart creation time");

    return chartProto;
  };
}());