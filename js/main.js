/* global math: false, katex: false, Terminal: false, document: false, webix: false, Awesomplete: false, Highcharts: false */
/* jshint node: true, browser: true, loopfunc: true, esnext: true */

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
      preerr = '<i class="prefix fa fa-angle-double-right"></i> <span class="cmderror">',
      sufans = '</span>',
      precisionVar = 8;  // default output format significant digits.

  var colors = ["#261C21", "#B0254F", "#DE4126", "#EB9605", "#3E6B48", "#CE1836", "#F85931", "#009989"],
      chart = null, bgcolor, chartDiv, lineShape, points, cmdinput, autocompleter, helpExt, parseData, terminal, createBaseChart;

  var hccolors = ['#7cb5ec', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1', '#434348'];

  var matchThemes = /^monokai|github|xcode|obsidian|vs|arta|railcasts|chalkboard|dark$/,
      matchChartCmds = /^line.*|linepts.*|curve.*|curvepts.*|sample.*|polar.*|scatter.*|linlog.*|loglin.*|loglog.*|xaxis.*|yaxis.*|title.*|subtitle.*$/,
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
    // bignumber causes erroneous calculations of sine(x).
    //number: 'bignumber'
  });

  // Import chart commands to mathjs.
  math.import({
    // Similiar to linepts() but with a logarithmic y axis.
    linlog: function linlog(args) {
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
        yAxis: {
          type: 'logarithmic',
          minorTickInterval: 0.1
        },
        tooltip: {
          valueDecimals: 6,
          shared: true,
        },
        series: dataSeries
      });
    },

    // Similiar to linepts() but with a logarithmic x axis.
    loglin: function loglin(args) {
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
        xAxis: {
          type: 'logarithmic',
          minorTickInterval: 0.1
        },
        tooltip: {
          valueDecimals: 6,
          shared: true,
        },
        series: dataSeries
      });
    },

    // Similiar to linepts() but with a logarithmic x and y axis.
    loglog: function loglog(args) {
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
        xAxis: {
          type: 'logarithmic',
          minorTickInterval: 0.1
        },
        yAxis: {
          type: 'logarithmic',
          minorTickInterval: 0.1
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
    // Does not accept time information.  All samples start at n = 0.
    // See samplen() for sample plot that takes time information.
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
    // Like sample plot, but accepts timing information.
    samplen: function samplen(args) {
      var dataSeries = [], 
          ydata,
          count,
          dataObj,
          buffer,
          argsLen = arguments.length;

      if (argsLen === 0) {
        return;
      } else if (argsLen === 1) {
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
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.map(JSON.parse).every(elem => Array.isArray(elem))) {
                throw new Error('The curve chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help curve</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args.map(JSON.parse));
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
                type: 'line',
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
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.map(JSON.parse).every(elem => Array.isArray(elem))) {
                throw new Error('The line chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help line</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args.map(JSON.parse));
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
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.map(JSON.parse).every(elem => Array.isArray(elem))) {
                throw new Error('The curvepts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help curvepts</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args.map(JSON.parse));
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
                type: 'line',
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
              }
              // Check if all the arguments are arrays.  If not throw an error.
              if (!args.map(JSON.parse).every(elem => Array.isArray(elem))) {
                throw new Error('The linepts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help linepts</em> for more information.');
              }
              // Format the data for plotting.
              dataSeries = parseData.apply(null, args.map(JSON.parse));
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
              chartType = 'line',
              markerEnabled = true;
          if (args.length === 0) {
            return preerr + 'The scatter chart needs to know what data to plot.  Please see <em>help scatter</em> for more information.' + sufans;
          } else {
            dataSeries = parseData.apply(null, args.map(JSON.parse));
          }

          if (chart) chart.destroy();

          chart = Highcharts.chart(chartDiv, {
            chart: {
              type: 'scatter',
              zoomType: 'xy',
              panning: true,
              panKey: 'shift'
            },
            plotOptions: {
              scatter: {
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
            },
            xAxis: {
              startOnTick: true,
              endOnTick: true
            },
            series: dataSeries
          });

          return '';
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

  createBaseChart = function createBaseChart(container, chartData, uoptions) {

    var defaults = {
      type: 'line',
      enableMarkers: false,
      xmTickInterval: null,
      xType: 'linear',
      ymTickInterval: null,
      yType: 'linear'
    };

    var options = uoptions || defaults;
    options.type = options.type || defaults.type;
    options.enableMarkers = options.enableMarkers || defaults.enableMarkers;
    options.xmTickInterval = options.xmTickInterval || defaults.xmTickInterval;
    options.xType = options.xType || defaults.xType;
    options.ymTickInterval = options.ymTickInterval || defaults.ymTickInterval;
    options.yType = options.yType || defaults.yType;

    return Highcharts.chart(container, {
      chart: {
        type: options.type,
        zoomType: 'x',
        panning: true,
        panKey: 'shift'
      },
      plotOptions: {
        series: {
          marker: {
            enabled: options.enableMarkers,
            connectNulls: true
          }
        }
      },
      xAxis: {
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
}());