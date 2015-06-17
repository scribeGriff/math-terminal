/* global math: false, katex: false, Terminal: false, document: false, vis: false, webix: false, Awesomplete: false, Ink: false */
/* jshint node: true, browser: true, loopfunc: true */

/* globals */
/* For debugging autocomplete and later perhaps as an option to disable. */
var awesomplete = true;
/* Detect when autocomplete menu is open to prevent terminal behavior on Enter key. */
var acIsOpen = false;

(function () {
  "use: strict";

  var parser = new math.parser(),
      preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">',
      preerr = '<i class="prefix fa fa-angle-double-right"></i> <span class="cmderr">',
      sufans = '</span>',
      precision = 8,  // default output format significant digits.
      sampleChart = false;

  var colors = ["#261C21", "#B0254F", "#DE4126", "#EB9605", "#261C21", "#3E6B48", "#CE1836", "#F85931", "#009989"],
      chart = null, bgcolor, sampleSeries,
      points, cmdinput, autocompleter,
      parseData, createChart, terminal, sampleChartType;

  var matchThemes = /^monokai|github|xcode|obsidian|vs|arta|railcasts|chalkboard|dark$/,
      matchChartCmds = /^line.*|linepts.*|curve.*|curvepts.*|samples.*|xaxis.*|yaxis.*$/,
      matchWaveGenCmds = /sinewave.*|squarewave.*|sawtoothwave.*|trianglewave.*|impulse.*|step.*$/,
      unformatedResults = /info.*$/;

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

  var helpinfo = [
    '<table class="ink-table">',
    '<tr><td>clear</td><td class="answer">clears command window</td></tr>',
    '<tr><td>clear vars</td><td class="answer">clears workspace variables</td></tr>',
    '<tr><td>clear all</td><td class="answer">clears window and variables</td></tr>',
    '<tr><td>clear chart</td><td class="answer">clears current chart</td></tr>',
    '<tr><td>info(<em>var</em>)</td><td class="answer">provides names (keys) of returned values for a <em>var</em> that contains multiple values</td></tr>',
    '<tr><td>getData(<em>"name", var</em>)</td><td class="answer">retrieves <em>name</em> value for a <em>var</em> that contains multiple values</td></tr>',
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

  math.config({
    number: 'bignumber'
  });

  // Import chart commands to mathjs.
  math.import({
    // Draws a curve through each data point but doesn't draw specific points.
    curve: function curve(args) {
      points = false;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "spline", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Draws a line to each data point but doesn't draw specific points.
    line: function line(args) {
      points = false;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "line", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Draws a curve through each data point and draws specific points.
    curvepts: function curvepts(args) {
      points = true;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "spline", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Draws a line through each data point and draws specific points.
    linepts: function linepts(args) {
      points = true;
      if (chart) chart.destructor();

      var data = parseData.apply(null, arguments);

      chart = createChart(data, "line", points);

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Draws a data point chart using bar and points
    samples: function samples(args) {
      var data, max, min, start, end, mod, 
          step, templ, len;

      if (chart) chart.destructor();

      sampleChart = true;

      bgcolor = bgcolors[terminal.getTheme()];

      data = parseData.apply(null, arguments);
      mod = Math.trunc(data.length / 10);

      if (mod === 1) {
        templ = "#data0#";
      } else {
        templ = function(obj) {
          return (obj.data0 % mod ? "" : obj.data0);
        };
      }

      max = math.max(math.matrix(data).subset(math.index([0, data.length], [1, data[0].length])));
      min = math.min(math.matrix(data).subset(math.index([0, data.length], [1, data[0].length])));

      if (min < 0) {
        if (max < 0) {
          start = Math.floor((min - 1) / 10) * 10;
          end = 0;
        } else {
          start = Math.floor((min - 1) / 10) * 10;
          end = Math.ceil((max + 1) / 10) * 10;
        }
      } else {
        start = 0;
        end = Math.ceil((max + 1) / 10) * 10;
      }

      sampleSeries = new Array(data[0].length - 1);
      len = data[0].length;

      if (len < 3) {
        sampleChartType = "spline";
        sampleSeries = [
          {
            value:"#data1#",
            line:{
              color: bgcolor,
              width: 1
            },
            item: {
              color: bgcolor,
              borderColor: colors[1],
              radius: 4
            }
          },
          {
            type:"bar",
            barWidth: 3,
            value:"#data1#",
            color:colors[1],
            tooltip:{
              template: function(obj) {
                return (Math.round(obj.data1));
              }
            }
          }
        ];
      } else {
        sampleChartType = "bar";
        for (var i = 1; i < len; i++) {
          sampleSeries[i - 1] = {
            value:"#data" + i + "#",
            color:colors[i],
            tooltip:{
              template: function(obj) {
                return (Math.round(obj["data" + i]));
              }
            }
          };
        }
      }

      // Scaling the power of the range to provide a step size.
      // The number 5 means that half way through a power of 10, the scale 
      // will move to the next largest step size.
      step = Math.pow(10, Math.trunc(Math.log10(Math.abs(end - start) * 5)) - 1);

      chart = webix.ui({
        container: "chart-div",
        view: "chart",
        type: sampleChartType,
        barWidth: 3,
        xAxis: {
          //color: need to change based on theme
          template: templ,
          lines: false
        },
        yAxis: {
          start: start,
          end: end,
          step: step,
          lines: false
        },
        eventRadius: 10,
        series: sampleSeries,
        origin: 0,
        datatype: "jsarray",
        data: data
      });
      
      if (sampleChartType === "bar") {
        chart.add({barWidth: 3});
      } 

      webix.event(window, "resize", function () {
        chart.adjust();
      });
    },
    // Adds and xaxis label
    xaxis: function xaxis(xaxisTitle) {
      if (chart) {
        chart.config.xAxis.title = xaxisTitle;
        chart.refresh();
      }
    },
    // Adds a y axis label
    yaxis: function yaxis(yaxisTitle) {
      if (chart) {
        chart.config.yAxis.title = yaxisTitle;
        chart.refresh();
      }
    },
    // Update sample chart so line remains transparent to user.
    // TODO: Accomodate multiple plots.
    updateSampleChart: function updateSampleChart(bgcolorIndex) {
      if (chart && sampleChart && sampleChartType === "spline") {
        bgcolor = bgcolors[bgcolorIndex];
        sampleSeries[0].line.color = bgcolor;
        sampleSeries[0].item.color = bgcolor;
        chart.define("series", sampleSeries);
        chart.refresh();
      }
    },
    // This will be a general purpose getter for each function that returns
    // an object.  Each object would have an info field.
    info: function info(complexObject) {
      return math.eval("info", complexObject);
    },
    // For functions that return multiple values, getData
    // retrieves and returns each value.
    getData: function getData(key, object) {
      return math.eval(key, object);
    }
  }, {
    wrap: true
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
              terminal.clearWelcome();
              if (chart) {
                chart.destructor();
                sampleChart = false;
              }
              return '';
            } else if (args[0] === 'chart') {
              if (chart) {
                chart.destructor();
                sampleChart = false;
              }
              return '';
            } else {
              return preerr + 'Invalid clear argument' + sufans;
            }
          }
          terminal.clear();
          terminal.clearWelcome();
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
              math.updateSampleChart(args[0]);
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
          return math.version;

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
              if (cmd.match(unformatedResults)) {
                return preans + formres + sufans;
              } else {
                katstr = katex.renderToString(formres);
                return preans + katstr + sufans;
              }
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
    var lenj = arguments[0].length,
        lenk = arguments.length,
        data = new Array(lenj),
        buffer;
    for (var j = 0; j < lenj; j++) {
      buffer = new Array(lenk);
      for (var k = 0; k < lenk; k++) {
        if (j >= arguments[k].length) {
          buffer[k] = null;
        } else {
          buffer[k] = parseFloat(arguments[k][j]);
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
    var itemRadius = usePoints ? 4 : 0,
        mod = Math.trunc(data.length / 5),
        series = new Array(data[0].length - 1),
        len = data[0].length,
        chartProto;

    for (var i = 1; i < len; i++) {
      series[i - 1] = {
        value: "#data" + i + "#",
        item: {
          color: colors[i],
          radius: itemRadius
        },
        line: {
          color: colors[i],
          width: 3
        }
      };
    }

    chartProto = webix.ui({
      id: "lineChart",
      view: "chart",
      data: data,
      datatype: "jsarray",
      container: "chart-div",
      type: type,
      border: true,
      xAxis: {
        template: function(obj){
          return (obj.data0 % mod ? "" : obj.data0);
        },
        lines: function(obj){
          return (obj.data0 % mod ? false:true);
        }
      },
      yAxis: {},
      series: series
    });

    console.timeEnd("chart creation time");

    return chartProto;
  };
}());