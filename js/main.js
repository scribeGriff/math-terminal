/* global math: false, katex: false, Terminal: false, document: false, webix: false, Awesomplete: false, Highcharts: false */
/* jshint node: true, browser: true, loopfunc: true */

/* globals */
/* For debugging autocomplete and later perhaps as an option to disable. */
var awesomplete = true;
/* Detect when autocomplete menu is open to prevent terminal behavior on Enter key. */
var acIsOpen = false;
/* For terminal to detect if command completion should be above or below input */
var awesompleteDivUl = null;


(function () {
  "use: strict";

  var parser = new math.parser(),
      preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">',
      preerr = '<i class="prefix fa fa-angle-double-right"></i> <span class="cmderr">',
      sufans = '</span>',
      precision = 8,  // default output format significant digits.
      sampleChart = false;

  var colors = ["#261C21", "#B0254F", "#DE4126", "#EB9605", "#3E6B48", "#CE1836", "#F85931", "#009989"],
      chart = null, bgcolor, sampleSeries, chartDiv, lineShape, parseDataPolar,
      points, cmdinput, autocompleter, helpExt, chartMode, chartType,
      parseData, createChart, terminal, sampleChartType, parseDataOld;

  var hccolors = ['#7cb5ec', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1', '#434348'];

  var matchThemes = /^monokai|github|xcode|obsidian|vs|arta|railcasts|chalkboard|dark$/,
      matchChartCmds = /^line.*|linepts.*|curve.*|curvepts.*|sample.*|polar.*|xaxis.*|yaxis.*|title.*|subtitle.*$/,
      matchWaveGenCmds = /sinewave.*|squarewave.*|sawtoothwave.*|trianglewave.*|impulse.*|step.*|gauss.*$/,
      matchMathExtensions = /fft.*|ifft.*|fsps.*|conv.*|deconv.*|corr.*|filter1d.*|length.*|addSeqs.*$/;

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

      webix.ajax("data/helpext.json").then(function(helpext) {
        helpExt = helpext.json();
      });

      awesompleteDivUl = document.querySelector('div.awesomplete > ul');

      chartDiv = document.getElementById('chart-div');
    }
  };

  math.config({
    //number: 'bignumber'
  });

  // Import chart commands to mathjs.
  math.import({
    // Draws a curve through each data point but doesn't draw specific points.
    curve: function curve(args) {
      var dataSeries;
      if (arguments.length === 0) {
        return;
      } else {
        dataSeries = parseData.apply(null, arguments);
      }

      if (chart) chart.destroy();

      chart = Highcharts.chart(chartDiv, {
        chart: {
          type: 'spline',
          zoomType: 'x',
          panning: true,
          panKey: 'shift'
        },
        plotOptions: {
          series: {
            marker: {
              enabled: false,
              connectNulls: true
            }
          }
        },
        tooltip: {
          valueDecimals: 6,
          shared: true,
        },
        series: dataSeries
      });
    },
    // Draws a line to each data point but doesn't draw specific points.
    line: function line(args) {
      var dataSeries;
      if (arguments.length === 0) {
        return;
      } else {
        dataSeries = parseData.apply(null, arguments);
      }

      if (chart) chart.destroy();

      chart = Highcharts.chart(chartDiv, {
        chart: {
          type: 'line',
          zoomType: 'x',
          panning: true,
          panKey: 'shift'
        },
        plotOptions: {
          series: {
            marker: {
              enabled: false,
              connectNulls: true
            }
          }
        },
        tooltip: {
          valueDecimals: 6,
          shared: true,
        },
        series: dataSeries
      });

    },
    // Draws a curve through each data point and draws specific points.
    curvepts: function curvepts(args) {
      var dataSeries;
      if (arguments.length === 0) {
        return;
      } else {
        dataSeries = parseData.apply(null, arguments);
      }

      if (chart) chart.destroy();

      chart = Highcharts.chart(chartDiv, {
        chart: {
          type: 'spline',
          zoomType: 'x',
          panning: true,
          panKey: 'shift'
        },
        plotOptions: {
          series: {
            marker: {
              enabled: true,
              connectNulls: true
            }
          }
        },
        tooltip: {
          valueDecimals: 6,
          shared: true,
        },
        series: dataSeries
      });

    },
    // Draws a line through each data point and draws specific points.
    linepts: function linepts(args) {
      var dataSeries;
      if (arguments.length === 0) {
        return;
      } else {
        dataSeries = parseData.apply(null, arguments);
      }

      if (chart) chart.destroy();

      chart = Highcharts.chart(chartDiv, {
        chart: {
          type: 'line',
          zoomType: 'x',
          panning: true,
          panKey: 'shift'
        },
        plotOptions: {
          series: {
            marker: {
              enabled: true,
              connectNulls: true
            }
          }
        },
        tooltip: {
          valueDecimals: 6,
          shared: true,
        },
        series: dataSeries
      });

    },
    // Draws a polar plot.
    polar: function polar(args) {
      var dataSeries = [], 
          ydata,
          argsLen = arguments.length,
          argsZeroLen = arguments[0].length,
          interval = 360 / argsZeroLen;

      if (argsLen === 0) {
        return;
      } else {
        for (var k = 0; k < argsLen; k++) {
          ydata = new Array(argsZeroLen);
          for (var l = 0; l < argsZeroLen; l++) {
            ydata[l] = parseFloat(arguments[k][l]);
          }
          // drop the last point since in polar charts 0 and 2pi
          // should overlap.
          // TODO: consider cases where this is not valid.
          ydata.splice(-1,1);

          var dataObj = {
            type: 'line',
            name: 'set' + k + 1,
            data: ydata,
            dashStyle: 'LongDash'
          };

          dataSeries.push(dataObj);
        }
      }

      if (chart) chart.destroy();

      chart = Highcharts.chart(chartDiv, {
        chart: {
          polar: true
        },
        pane: {
          startAngle: 0,
          endAngle: 360
        },
        xAxis: {
          tickInterval: 30,
          min: 0,
          max: 360,
          labels: {
            formatter: function () {
              return this.value + '°';
            },
            step: 3
          }
        },
        yAxis: {
          min: 0
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
        series: dataSeries
      });
    },
    // Draws a stem chart using bar and points.
    sample: function sample(args) {
      var dataSeries = [], 
          ydata,
          count,
          argsLen = arguments.length;

      if (argsLen === 0) {
        return;
      } else {
        count = 1;
        for (var k = 0; k < argsLen; k++) {
          ydata = new Array(arguments[k].length);
          for (var l = 0; l < arguments[k].length; l++) {
            ydata[l] = parseFloat(arguments[k][l]);
          }

          var dataObj = [{
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

      if (chart) chart.destroy();

      chart = Highcharts.chart(chartDiv, {
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
        series: dataSeries
      });
    },
    // Adds and xaxis label
    xaxis: function xaxisp(xaxisTitle) {
      if (chart) {
        chart.xAxis[0].setTitle({
          text: xaxisTitle,
        });
      }
    },
    // Adds a y axis label
    yaxis: function yaxis(yaxisTitle) {
      if (chart) {
        chart.yAxis[0].setTitle({
          text: yaxisTitle
        });
      }
    },
    // Adds a chart title
    title: function title(chartTitle, titleColor) {
      if (chart) {
        chart.setTitle({
          text: chartTitle
        });
        if (titleColor !== null) {
          chart.setTitle({
            style: { 
              color: titleColor 
            } 
          });
        }
      }
    },
    subtitle: function title(chartSubTitle, subTitleColor) {
      if (chart) {
        chart.setTitle(null, {
          text: chartSubTitle
        });
        if (subTitleColor !== null) {
          chart.setTitle(null, {
            style: { 
              color: subTitleColor 
            } 
          });
        }
      }
    },
    // For functions that return multiple values, getData
    // retrieves and returns each value.
    getData: function getData(key, object) {
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
              katstr = katex.renderToString(formres);
              return preans + katstr + sufans;
            } catch(error) {
              return preans + formres + sufans;
            }
          }
      }
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

 /* parseDataWebix = function parseData(args) {
    var data, xdata, ydata;
    var argsLen = arguments.length;
    var argsZeroLen = arguments[0].length;

    if (argsLen === 1) {
      // need to generate an x vector
      xdata = new Array(argsZeroLen).fill(0).map(function(x, i) { return i + 1; });
      ydata = new Array(argsZeroLen);

      for (var i = 0; i < argsZeroLen; i++) {
        ydata[i] = parseFloat(arguments[0][i]);
      }
      data = [{
        type: chartType,
        x: xdata,
        y: ydata,
        mode: chartMode,
        line: {
          color: colors[1],
          width: 3,
          shape: lineShape
        },
        marker: {
          size: 9
        }
      }];
    } else {
      // create data objects for each pair of x and y
      // push the objects onto the data array.

      // TODO: need to account for y data lengths not equal to x data length.

      data = [];
      xdata = new Array(argsZeroLen);

      for (var j = 0; j < argsZeroLen; j++) {
        xdata[j] = parseFloat(arguments[0][j]);
      }

      for (var k = 1; k < argsLen; k++) {
        ydata = new Array(argsZeroLen);
        for (var l = 0; l < argsZeroLen; l++) {
          ydata[l] = parseFloat(arguments[k][l]);
        }

        var dataObj = {
          type: chartType,
          x: xdata,
          y: ydata,
          mode: chartMode,
          name: 'y' + k,
          line: {
            color: colors[k],
            width: 3,
            shape: lineShape
          },
          marker: {
            size: 9
          }
        };

        data.push(dataObj);
      }
    }
    return data;
  };

  // Parse the data for the webix polar chart.
  parseDataPolar = function parseDataPolar(args) {
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
      buffer[0] = buffer[0] * 180 / math.pi;
      console.log(math.round(buffer[0]));
      data[j] = buffer;
    }
    console.timeEnd("data parsing time");
    return data;
  };

  // Parse the data for the various chart functions.
  parseDataOld = function parseDataOld(args) {
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
          return (obj.data0 % mod ? false : true);
        }
      },
      yAxis: {},
      series: series
    });

    console.timeEnd("chart creation time");

    return chartProto;
  };*/
}());