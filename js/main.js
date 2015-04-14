/* global math: false, katex: false, Terminal: false, document: false, vis: false, webix: false */
/* jshint node: true, browser: true */
(function () {
  "use: strict";

  var parser = new math.parser();
  var preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">';
  var sufans = '</span>';
  var precision = 8;  // default output format significant digits.
  var colors = ["#261C21", "#B0254F", "#DE4126", "#EB9605", "#261C21", "#3E6B48", "#CE1836", "#F85931", "#009989"];
  var chart = null;
  var points;

  var helpinfo = [
    '<table class="ink-table">',
    '<tr><td>clear</td><td class="answer">clears command window</td></tr>',
    '<tr><td>clear vars</td><td class="answer">clears workspace variables</td></tr>',
    '<tr><td>clear all</td><td class="answer">clears window and variables</td></tr>',
    '<tr><td>help</td><td class="answer">displays this help screen</td></tr>',
    '<tr><td>help <em>command</em></td><td class="answer">displays a link to Math.js <em>command</em> documentation</td></tr>',
    '<tr><td>precision</td><td class="answer">displays number of significant digits in formatted answer</td></tr>',
    '<tr><td>precision  <em>value</em></td><td class="answer">set precision of answer to <em>[0 - 16]</em> significant digits</td></tr>',
    '<tr><td>theme</td><td class="answer">displays current theme</td></tr>',
    '<tr><td>theme <em>name</em></td><td class="answer">change to theme <em>name</em> (monokai, github, xcode, obsidian, vs, arta, railcasts)</td></tr>',
    '</table>'
  ].join('');

  // Parse the data for the various chart functions function.
  var parseData = function(args) {
    var buffer;
    var data = [];
    for (var j = 0, lenj = arguments[0]._data.length; j < lenj; j++) {
      buffer = [];
      for (var k = 0, lenk = arguments.length; k < lenk; k++) {
        if (j >= arguments[k]._data.length) {
          buffer.push(null);
        } else {
          buffer.push(arguments[k]._data[j]);
        }
      }
      data.push(buffer);
    }
    return data;
  };

  // Creates a chart from the provided data and specified type.
  var createChart = function(data, type, usePoints) {
    var itemRadius = usePoints ? 4 : 0;

    var chartProto = webix.ui({
      id: "lineChart",
      view: "chart",
      container: "chartDiv",
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
      tooltip: {
        template: "#data1#"
      },
      eventRadius: 10,
      radius: 0,
      border: true,
      xAxis: {
        template: "#data0#"
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
          },
          tooltip: {
            template: "#data" + i + "#"
          },
          eventRadius: 10
        });
      }
    }

    chartProto.parse(data, "jsarray");

    return chartProto;
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
        chart.config.xAxis.title = yaxisTitle;
        chart.refresh();
      }
    }

  });

  // Convert the 'terminal' DOM element into a live terminal.
  // This example defines several custom commands for the terminal.
  var terminal = new Terminal('terminal', {}, {
    execute: function(cmd, args) {
      switch (cmd) {
        case 'clear':
          if (args && args[0]) {
            if (args.length > 1) {
              return preans + 'Too many arguments' + sufans;
            }
            else if (args[0] === 'vars') {
              parser.clear();
              return preans + 'Cleared workspace variables.' + sufans;
            } else if (args[0] === 'all') {
              parser.clear();
              terminal.clear();
              return '';
            } else return preans + 'Invalid clear argument' + sufans;
          }
          terminal.clear();
          return '';

        case 'help':
          if (args && args[0]) {
            if (args.length > 1) {
              return preans + 'Too many arguments' + sufans;
            } else {
              return preans + '<a href="http://mathjs.org/docs/reference/functions/' + args[0] + '.html" target="_blank">' + args[0] + ' docs at mathjs.org</a>' + sufans;
            }
          }
          return helpinfo;

        case 'theme':
          if (args && args[0]) {
            if (args.length > 1) {
              return preans + 'Too many arguments' + sufans;
            } else if (args[0].match(/^monokai|github|xcode|obsidian|vs|arta|railcasts$/)) { 
              terminal.setTheme(args[0]); 
              return ''; 
            } else return preans + 'Invalid theme' + sufans;
          }
          return preans + terminal.getTheme() + sufans;

        case 'precision':
          if (args && args[0]) {
            if (args.length > 1) {
              return preans + 'Too many arguments' + sufans;
            } else if (args[0].match(/^([0-9]|1[0-6])$/)) { 
              precision = parseInt(args[0]);
              return ''; 
            } else return preans + 'Invalid precision value' + sufans;
          }
          return preans + precision + sufans;

        case 'ver':
        case 'version':
          return '1.0.0';

        default:
          var line, command, result, katstr, formres;
          // Check for valid Math.js command.
          try {
            console.log(cmd);
            line = '';
            if (args) {
              line = args.join(" ");
            }
            command = cmd + line;
            console.log(command);
            result = parser.eval(command);
          } catch(error) {
            // Unknown command.
            return false;
          }
          if (command.match(/^line.*|linepts.*|curve.*|curvepts.*|xaxis.*|yaxis.*$/)) {
            // Generate plot but don't return any result for now.
            return '';
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
}());