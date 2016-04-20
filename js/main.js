/* global math: false, katex: false, Terminal: false, document: false, Awesomplete: false, Highcharts: false, Papa: false, moment: false, fetch: false, saveAs: false */
/* jshint node: true, browser: true, loopfunc: true, esnext: true */

/* For debugging autocomplete and later perhaps as an option to disable. */
// TODO: Can this be set by the terminal?
var awesomplete = true;

(function () {
  "use strict";

  var preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">',
      preerr = '<i class="prefix fa fa-angle-double-right"></i> <span class="cmderror">',
      sufans = '</span>',
      precisionVar = 8;  // default output format significant digits.

  var termName1 = 'terminal1',
      termName2 = 'terminal2',
      termName3 = 'terminal3',
      termName4 = 'terminal4';

  var colors = ["#261C21", "#B0254F", "#DE4126", "#EB9605", "#3E6B48", "#CE1836", "#F85931", "#009989"],
      hccolors = ['#7cb5ec', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1', '#434348', "#3E6B48", "#009989"];

  var terminal1, bgcolor, lineShape, points, cmdinput, autocompleter, helpExt, parseData, isValidColor, awesompleteDivUl, allCommands,
      parseDataPolar, parseDataSample, parseDataSamplen, createBaseChart, createPolarChart, createSampleChart, consoleCommands;

  var chartDiv1 = document.getElementById('chart-div1');

  var matchThemes = /^monokai|^github|^xcode|^obsidian|^vs|^arta|^railcasts|^chalkboard|^dark/,
      matchChartCmds = /^line$|^linepts$|^area$|^bar$|^column$|^curve$|^curvepts$|^sample$|^samplen$|^pie$|^polar$|^scatter$|^linlog$|^loglin$|^loglog$|^linlogpts$|^loglinpts$|^loglogpts$|^xaxis$|^yaxis$|^title$|^subtitle$|^series$/,
      matchWaveGenCmds = /^sinewave$|^squarewave$|^sawtoothwave$|^trianglewave$|^impulse$|^step$|^gauss$/,
      matchMathExtensions = /^fft$|^ifft$|^fsps$|^conv$|^deconv$|^corr$|^filter1d$|^length$|^addseqs$|^subseqs$|^getdata$|^outy$|^outn$|^outq$|^outqn$|^outr$|^outrn$|^outz$|^vars$|^loadvars$|^savevars$|^importfile$|^importurl$|^importlog$|^settoken$|^gettoken$/;

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
      plotBorderWidth: 0
    },
    plotOptions: {
      series: {
        allowPointSelect: true
      },
      pie: {
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true,
        states: {
          hover: {
            halo: false
          }
        }
      }
    },
    title: {
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
      gridLineDashStyle: 'dot',
      gridLineColor: '#76767A',
      gridZIndex: 0,
      endOnTick: false,
      labels: {
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
    '<tr><td>clear all</td><td class="answer">clears command window, workspace and stored variables, and current chart</td></tr>',
    '<tr><td>clear chart</td><td class="answer">clears current chart</td></tr>',
    '<tr><td>clear storage</td><td class="answer">clears variables from local storage (see <em>help vars</em>, <em>help loadvars</em> and <em>help savevars</em> for more information)</td></tr>',
    '<tr><td>docs</em></td><td class="answer">Opens a new tab or window with a complete set of documentation for Convolv extensions to the Mathjs library as well as all available console and charting commands.</td></tr>',
    '<tr><td>help</td><td class="answer">displays this help screen</td></tr>',
    '<tr><td>help <em>command</em></td><td class="answer">displays the <em>command</em> documentation</td></tr>',
    '<tr><td>precision</td><td class="answer">displays number of significant digits in formatted answer written to console</td></tr>',
    '<tr><td>precision  <em>value</em></td><td class="answer">set precision of the displayed answer to <em>[0 - 16]</em> significant digits</td></tr>',
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

      // Fetch the external help files.
      fetch("data/help.json")
        .then(function(response) {
        return response.json();
      }).then(function(json) {
        helpExt = json;
      }, function(error) {
        // Continue without help files.
      }).catch(function(ex) {
        // Continue without help files.
      });

      // Fetch the command list for awesomplete.
      fetch("data/aclist.json")
        .then(function(response) {
        return response.json();
      }).then(function(json) {
        autocompleter.list = json;
        allCommands = json;
      }, function(error) {
        // Continue without autocompleter.
      }).catch(function(ex) {
        // Continue without autocompleter.
        // TODO: Should set awesomplete = false?
      });

      // For terminal to detect if command completion should be above or below input
      // TODO: This needs to be modified to handle multiple terminals.
      awesompleteDivUl = document.querySelector('div.awesomplete > ul');
      terminal1.setAwesompleteDiv(awesompleteDivUl);
    }
  };

  // Set default data type for mathjs to 'Array' to be compatible with vanilla js.
  math.config({
    matrix: 'Array'
  });

  // Convert the termName1 DOM element into an interactive terminal.
  terminal1 = new Terminal(termName1, {}, {
    execute: function execute(cmd, args) {
      var parser = terminal1.getParser();
      var cmds = consoleCommands(cmd, args, terminal1, chartDiv1, parser, termName1);

      if (typeof cmds[cmd] !== 'function') {
        var result, katstr, formres;
        // Check for valid Math.js command.
        try {
          // This should allow the user to use either single or double quotes. Mathjs only allows strings in double quotes.
          // TODO: Not at all sure if this will work for all Mathjs situations.  TODO: Figure out a way to test for this.
          // Check also if a user is trying to use a variable name that is already a function.  Mathjs does not prevent this
          // but the ramifications are really ugly.
          cmd = cmd.replace(/(\w)'(\w)/g, "$1@%$2").replace(/'([^']*)'/g, '"$1"').replace(/(\w)@%(\w)/g, "$1'$2");
          if (cmd.includes("=")) {
            // Commands have the parentheses added to them in the allCommands list.
            var testcommand = cmd.split("=")[0].trim();
            if (allCommands.includes(testcommand)) {
              return preans + testcommand + ': Command names cannot be used as variable names. ' + cmd.replace(";", "") + ' is not valid.' + sufans;
            }
            testcommand = testcommand + "()";
            if (allCommands.includes(testcommand)) {
              return preans + testcommand.replace("(", "").replace(")", "") + ': Function names cannot be used as variable names. ' + cmd.replace(";", "") + ' is not valid.' + sufans;
            }
          }
          result = parser.eval(cmd);
        } catch(error) {
          return preerr + error + sufans;
        }
        if (cmd.match(/[;]$/)) {
          // Suppress the empty array symbol if line ends in a ;
          return '';
        } else {
          if (math.typeof(result) === 'Function') {
            return preans + math.typeof(result) + sufans;
          }
          if (math.typeof(result) === 'Object') {
            var _buffer = ['<table class="ink-table">'];
            for(var key in result) {
              if (result.hasOwnProperty(key)) {
                _buffer.push('<tr><td>' + key + '</td><td class="answer">' + math.eval(key, result) + '</td></tr>');
              }
            }
            _buffer.push('</table>');
            return _buffer.join('');
          }
          // Check for Katex format of solution if a number.
          if (math.typeof(result) != 'number') {
            return preans + result + sufans;
          }
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
        argsLen = arguments.length;

    if (argsLen === 1) {
      // use the default x vector
      ydata = new Array(arguments[0].length);
      for (var j = 0; j < arguments[0].length; j++) {
        ydata[j] = arguments[0][j];
      }
      dataObj = {
        cropThreshold: 600,
        data: ydata
      };
      dataSeries.push(dataObj);
    } else {
      // will need to create x,y pairs
      for (var k = 0; k < argsLen; k += 2) {
        ydata = new Array(arguments[k].length);
        for (var l = 0; l < arguments[k].length; l++) {
          buffer = new Array(2);
          buffer[0] = arguments[k][l];
          if (l >= arguments[k + 1].length) {
            buffer[1] = null;
          } else {
            buffer[1] = arguments[k + 1][l];
          }

          ydata[l] = buffer;
        }
        dataObj = {
          cropThreshold: 600,
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
        dataObj;

    for (var k = 0; k < argsLen; k++) {
      ydata = new Array(argsZeroLen);
      for (var l = 0; l < argsZeroLen; l++) {
        ydata[l] = arguments[k][l];
      }
      // drop the last point since in polar charts 0 and 2pi
      // should overlap.
      // TODO: consider cases where this is not valid.
      ydata.splice(-1,1);

      dataObj = {
        type: 'line',
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
        ydata[l] = arguments[k][l];
      }

      dataObj = [{
        type: 'column',
        cropThreshold: 600,
        name: 'Series ' + count++,
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
        ydata[j] = arguments[0][j];
      }

      dataObj = [{
        type: 'column',
        cropThreshold: 600,
        name: 'Series ' + 1,
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
          buffer[0] = arguments[k][l];
          if (l >= arguments[k + 1].length) {
            buffer[1] = null;
          } else {
            buffer[1] = arguments[k + 1][l];
          }

          ydata[l] = buffer;
        }
        dataObj = [{
          type: 'column',
          cropThreshold: 600,
          name: 'Series ' + count++,
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
      title: ' ',
      posFillColor: undefined,
      negFillColor: null,
      opacityFill: 0.75,
      zoomDir: 'xy',
      scatterOps: {},
      enableMarkers: false,
      xCategory: null,
      xEndOnTic: false,
      xGridLineWidth: 1,
      xLabelsY: 25,
      xStartOnTic: false,
      xmTickInterval: null,
      xOffset: 10,
      xType: 'linear',
      ymTickInterval: null,
      yType: 'linear',
      yLineWidth: 1,
      yTickWidth: 1,
      yOffset: 10,
      legLayout: 'vertical',
      legAlign: 'right',
      legVerticalAlign: 'top'
    };

    var options = uoptions || defaults;
    options.type = typeof options.type === "undefined" ? defaults.type : options.type;
    options.title = typeof options.title === "undefined" ? defaults.title : options.title;
    options.posFillColor = typeof options.posFillColor === "undefined" ? defaults.posFillColor : options.posFillColor;
    options.negFillColor = typeof options.negFillColor === "undefined" ? defaults.negFillColor : options.negFillColor;
    options.opacityFill = typeof options.opacityFill === "undefined" ? defaults.opacityFill : options.opacityFill;
    options.enableMarkers = typeof options.enableMarkers === "undefined" ? defaults.enableMarkers : options.enableMarkers;
    options.zoomDir = typeof options.zoomDir === "undefined" ? defaults.zoomDir : options.zoomDir;
    options.scatterOps = typeof options.scatterOps === "undefined" ? defaults.scatterOps : options.scatterOps;
    options.xCategory = typeof options.xCategory === "undefined" ? defaults.xCategory : options.xCategory;
    options.xGridLineWidth = typeof options.xGridLineWidth === "undefined" ? defaults.xGridLineWidth : options.xGridLineWidth;
    options.xLabelsY = typeof options.xLabelsY === "undefined" ? defaults.xLabelsY : options.xLabelsY;
    options.xEndOnTic = typeof options.xEndOnTic === "undefined" ? defaults.xEndOnTic : options.xEndOnTic;
    options.xStartOnTic = typeof options.xStartOnTic === "undefined" ? defaults.xStartOnTic : options.xStartOnTic;
    options.xmTickInterval = typeof options.xmTickInterval === "undefined" ? defaults.xmTickInterval : options.xmTickInterval;
    options.xOffset = typeof options.xOffset === "undefined" ? defaults.xOffset : options.xOffset;
    options.xType = typeof options.xType === "undefined" ? defaults.xType : options.xType;
    options.ymTickInterval = typeof options.ymTickInterval === "undefined" ? defaults.ymTickInterval : options.ymTickInterval;
    options.yType = typeof options.yType === "undefined" ? defaults.yType : options.yType;
    options.yLineWidth = typeof options.yLineWidth === "undefined" ? defaults.yLineWidth : options.yLineWidth;
    options.yTickWidth = typeof options.yTickWidth === "undefined" ? defaults.yTickWidth : options.yTickWidth;
    options.yOffset = typeof options.yOffset === "undefined" ? defaults.yOffset : options.yOffset;
    options.legLayout = typeof options.legLayout === "undefined" ? defaults.legLayout : options.legLayout;
    options.legAlign = typeof options.legAlign === "undefined" ? defaults.legAlign : options.legAlign;
    options.legVerticalAlign = typeof options.legVerticalAlign === "undefined" ? defaults.legVerticalAlign : options.legVerticalAlign;

    return Highcharts.chart(container, {
      chart: {
        type: options.type,
        zoomType: options.zoomDir,
        panning: true,
        panKey: 'shift'
      },
      legend: {
        layout: options.legLayout,
        align: options.legAlign,
        verticalAlign: options.legVerticalAlign
      },
      plotOptions: {
        series: {
          marker: {
            enabled: options.enableMarkers,
            connectNulls: true
          },
          color: options.posFillColor,
          negativeColor: options.negFillColor,
          fillOpacity: options.opacityFill
        },
        scatter: options.scatterOps
      },
      xAxis: {
        categories: options.xCategory,
        endOnTic: options.xEndOnTic,
        startOnTic: options.xStartOnTic,
        type: options.xType,
        minorTickInterval: options.xmTickInterval,
        offset: options.xOffset,
        gridLineWidth: options.xGridLineWidth,
        labels: {
          y: options.xLabelsY
        }
      },
      yAxis: {
        type: options.yType,
        minorTickInterval: options.ymTickInterval,
        lineWidth: options.yLineWidth,
        tickWidth: options.yTickWidth,
        offset:options.yOffset
      },
      tooltip: {
        shared: true,
      },
      title: {
        text: options.title
      },
      series: chartData
    });
  };

  createPolarChart = function createPolarChart(container, chartData) {

    var interval = 360 / chartData[0].data.length;

    return Highcharts.chart(container, {
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
      title: {
        text: ' '
      },
      series: chartData
    });
  };

  createSampleChart = function createSampleChart(container, chartData) {

    return Highcharts.chart(container, {
      chart: {
        zoomType: 'x',
        panning: true,
        panKey: 'shift',
        plotBorderWidth: 1
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
      xAxis: {
        gridLineWidth: 1,
        offset: 10,
        labels: {
          y: 25
        }
      },
      yAxis: {
        lineWidth: 1,
        tickWidth: 1,
        offset: 10,
        plotLines: [{
          color: '#76767A',
          width: 2,
          value: 0,
          zIndex: 5
        }]
      },
      title: {
        text: ' '
      },
      series: chartData
    });
  };

  isValidColor = function isValidColor(colorString) {
    var image = document.createElement("img");
    image.style.color = "rgb(0, 0, 0)";
    image.style.color = colorString;
    if (image.style.color !== "rgb(0, 0, 0)") { 
      return true; 
    }
    image.style.color = "rgb(255, 255, 255)";
    image.style.color = colorString;
    return image.style.color !== "rgb(255, 255, 255)";
  };

  consoleCommands = function consoleCommands(cmd, args, terminal, chartDiv, parser, termName) {
    return {
      clear: function clear() {
        var chart = terminal.getChart();
        if (args && args[0]) {
          if (args.length > 1) {
            return preerr + 'Too many arguments' + sufans;
          }
          else if (args[0] === 'vars') {
            parser.clear();
            return preans + 'Cleared terminal variables.' + sufans;
          } else if (args[0] === 'all') {
            parser.clear();
            terminal.clear();
            terminal.clearWelcome();
            localStorage.removeItem(termName);
            if (chart) {
              chart.destroy();
              terminal.setChart(null);
            }
            return '';
          } else if (args[0] === 'chart') {
            if (chart) {
              chart.destroy();
              terminal.setChart(null);
            }
            return '';
          } else if (args[0] === 'storage') {
            localStorage.removeItem(termName);
            return preans + 'Cleared variables saved to local storage.' + sufans;
          } else {
            return preerr + 'Invalid clear argument.  Choose either no argument (clears just the console), all, chart, storage or vars.' + sufans;
          }
        }
        terminal.clear();
        terminal.clearWelcome();
        return '';
      },

      help: function help() {
        if (args && args[0]) {
          args[0] = args[0].replace("(", "").replace(")", "");
          // Too many arguments
          if (args.length > 1) {
            return preerr + 'Too many arguments' + sufans;
          }
          var _helpOrder = ["Name", "Category", "Description", "Syntax", "Example", "See also", "Type"],
              _buffer = ['<table class="ink-table">'],
              _label = {
                "name": "Name",
                "category": "Category",
                "syntax": "Syntax",
                "description": "Description",
                "examples": "Examples",
                "seealso": "See also"
              };
          var _helpEntry = helpExt.find(x => x.Name === args[0]);
          // Convolv custom commands and functions
          if (typeof _helpEntry !== 'undefined') {
            for (var i = 0; i < _helpOrder.length; i++) {
              if (Array.isArray(_helpEntry[_helpOrder[i]])) {
                _buffer.push('<tr><td>' + _helpOrder[i] + '</td><td class="answer">' + _helpEntry[_helpOrder[i]].join(', ') + '</td></tr>');
              } else {
                _buffer.push('<tr><td>' + _helpOrder[i] + '</td><td class="answer">' + _helpEntry[_helpOrder[i]] + '</td></tr>');
              }
            }
            _buffer.push('</table>');
            return _buffer.join('');
          }
          // Maybe it's a Mathjs function.
          try {
            for(var key in math.help(args[0]).doc) {
              if (math.help(args[0]).doc.hasOwnProperty(key)) {
                if (Array.isArray(math.help(args[0]).doc[key])) {
                  _buffer.push('<tr><td>' + _label[key] + '</td><td class="answer">' + math.help(args[0]).doc[key].join(', ') + '</td></tr>');
                } else {
                  _buffer.push('<tr><td>' + _label[key] + '</td><td class="answer">' + math.help(args[0]).doc[key] + '</td></tr>');
                }
              }
            }
            _buffer.push('<tr><td>' + 'Link' + '</td><td class="answer">' + '<a href="http://mathjs.org/docs/reference/functions/' + args[0] + '.html" target="_blank">' + args[0] + ' docs at mathjs.org</a>' + '</td></tr>');
            _buffer.push('</table>');
            return _buffer.join('');
          } catch(error) {
            // Unknown command.
            return preerr + 'Unknown command or function: ' + args[0] + sufans;
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

      area: function area() {
        var dataSeries,
            chart = terminal.getChart(),
            options = {
              type: 'area',
              enableMarkers: false,
              opacityFill: 0.5
            };
        if (args.length === 0) {
          return preerr + 'The area chart needs to know what data to plot.  Please see <em>help area</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for plotting.
          try {
            // Check if argument is a terminal variable by trying to retrieve the value.
            for (var i = 0; i < args.length; i++) {
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The area chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help area</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
            }
            // Format the data for plotting.
            dataSeries = parseData.apply(null, args);
            // Catch any errors.
          } catch(error) {
            // This usually means the data was passed without using pairs of arrays for x and y values.
            if (error.name.toString() == "TypeError") {
              return preerr + error.name + ': The area chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help area</em> for more information.' + sufans;
            }
            // Some other kind of error has occurred.
            return preerr + 'The area chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help area</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      bar: function bar() {
        var dataSeries,
            chart = terminal.getChart(),
            options = {
              type: 'bar',
              enableMarkers: false,
              xGridLineWidth: 0,
              xLabelsY: null,
              xOffset: 0,
              yLineWidth: 0,
              yTickWidth: 0,
              yOffset: 0
            };

        if (args.length === 0) {
          return preerr + 'The bar chart needs to know what data to plot.  Please see <em>help bar</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for plotting.
          try {
            // Check if argument is a terminal variable by trying to retrieve the value.
            for (var i = 0; i < args.length; i++) {
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The bar chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help bar</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
            }
            // Format the data for plotting.
            dataSeries = parseData.apply(null, args);
            // Catch any errors.
          } catch(error) {
            // This usually means the data was passed without using pairs of arrays for x and y values.
            if (error.name.toString() == "TypeError") {
              return preerr + error.name + ': The bar chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help bar</em> for more information.' + sufans;
            }
            // Some other kind of error has occurred.
            return preerr + 'The bar chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help bar</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      column: function column() {
        var dataSeries,
            chart = terminal.getChart(),
            options = {
              type: 'column',
              enableMarkers: false,
              xGridLineWidth: 0,
              xLabelsY: null,
              xOffset: 0,
              yLineWidth: 0,
              yTickWidth: 0,
              yOffset: 0
            };

        if (args.length === 0) {
          return preerr + 'The column chart needs to know what data to plot.  Please see <em>help column</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for plotting.
          try {
            // Check if argument is a terminal variable by trying to retrieve the value.
            for (var i = 0; i < args.length; i++) {
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The column chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help column</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
            }
            // Format the data for plotting.
            dataSeries = parseData.apply(null, args);
            // Catch any errors.
          } catch(error) {
            // This usually means the data was passed without using pairs of arrays for x and y values.
            if (error.name.toString() == "TypeError") {
              return preerr + error.name + ': The column chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help column</em> for more information.' + sufans;
            }
            // Some other kind of error has occurred.
            return preerr + 'The column chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help column</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      curve: function curve() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The curve chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help curve</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The curve chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help curve</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      line: function line() {
        var dataSeries,
            chart = terminal.getChart(),
            options = {
              enableMarkers: false
            };
        if (args.length === 0) {
          return preerr + 'The line chart needs to know what data to plot.  Please see <em>help line</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for plotting.
          try {
            console.log(args);
            // Check if argument is a terminal variable by trying to retrieve the value.
            for (var i = 0; i < args.length; i++) {
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The line chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help line</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The line chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help line</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      curvepts: function curvepts() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The curvepts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help curvepts</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The curvepts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help curvepts</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      linepts: function linepts() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The linepts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help linepts</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The linepts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help linepts</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      scatter: function scatter() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The scatter chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help scatter</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The scatter chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help scatter</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        terminal.setChart(chart);
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        return '';
      },

      linlog: function linlog() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The linlog chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help linlog</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The linlog chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help linlog</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        terminal.setChart(chart);
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        return '';
      },

      loglin: function loglin() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The loglin chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglin</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The loglin chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglin</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      loglog: function loglog() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The loglog chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglog</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The loglog chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglog</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      linlogpts: function linlogpts() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The linlogpts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help linlogpts</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The linlogpts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help linlogpts</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      loglinpts: function loglinpts() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The loglinpts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglinpts</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The loglinpts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglinpts</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      loglogpts: function loglogpts() {
        var dataSeries,
            chart = terminal.getChart(),
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
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The loglogpts chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help loglogpts</em> for more information.');
            }
            // If the xaxis values are strings, then pass the array as the x category option.  
            // This is only valid for an x axis with a single array of category definitions.
            if (args[0].every(elem => typeof elem === "string")) {
              options.xCategory = args[0];
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
            return preerr + 'The loglogpts chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help loglogpts</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      pie: function pie() {
        var dataSeries = [],
            dataArray = [],
            dataObj,
            finalObj,
            chart = terminal.getChart(),
            options = {
              type: 'pie',
              title: 'Pie Chart',
              legLayout: 'horizontal',
              legAlign: 'center',
              legVerticalAlign: 'bottom'
            };

        if (args.length === 0) {
          return preerr + 'The pie chart needs to know what data to plot.  Please see <em>help pie</em> for more information.' + sufans;
        }
        if (args.length > 2) {
          return preerr + 'The pie chart only accepts either one or two arrays as arguments.  Please see <em>help pie</em> for more information.' + sufans;
        }
        // Try to parse the data and format it for plotting.
        try {
          // Check if argument is a terminal variable by trying to retrieve the value.
          for (var i = 0; i < args.length; i++) {
            try {
              args[i] = parser.eval(args[i]);
            } catch (error) {
              // Not a variable in the console.
              // No need to catch this, just proceed.
            }
            if (math.typeof(args[i]) === 'Matrix') {
              try {
                args[i] = JSON.parse(args[i]);
              } catch (error) {
                // Need to decide if error should be thrown.
              }
            }
          }
          // Check if all the arguments are arrays.  If not throw an error.
          if (!args.every(elem => Array.isArray(elem))) {
            throw new Error('The pie chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help pie</em> for more information.');
          }
          // Format the data for plotting.
          if (args.length === 1) {
            var ydata = new Array(args[0].length);
            for (var k = 0; k < args[0].length; k++) {
              ydata[k] = args[0][k];
            }
            dataObj = {
              cropThreshold: 600,
              data: ydata
            };
            dataSeries.push(dataObj);
          } else {
            for (var j = 0; j < args[0].length; j++) {
              dataObj = {
                y: args[1][j],
                name: args[0][j]
              };
              dataArray.push(dataObj);
            }
            finalObj = {
              data: dataArray
            };
            dataSeries.push(finalObj);
          }
          // Catch any errors.
        } catch(error) {
          // This usually means the data was passed without using pairs of arrays for x and y values.
          if (error.name.toString() == "TypeError") {
            return preerr + error.name + ': The pie chart requires data to be submitted as either a single array of numeric values or an array of strings followed by an array of numeric values.  Please see <em>help pie</em> for more information.' + sufans;
          }
          // Some other kind of error has occurred.
          return preerr + 'The pie chart requires data to be submitted as either a single array of numeric values or an array of strings followed by an array of numeric values.  Please see <em>help pie</em> for more information. ' + error + sufans; 
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div and with the required options.
        chart = createBaseChart(chartDiv, dataSeries, options);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      // Draws a polar plot.
      polar: function polar() {
        var dataSeries,
            chart = terminal.getChart(),
            argsLen = args.length;

        if (argsLen === 0) {
          return preerr + 'The polar chart needs to know what data to plot.  Please see <em>help polar</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for plotting.
          try {
            // Check if argument is a terminal variable by trying to retrieve the value.
            for (var i = 0; i < argsLen; i++) {
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
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
            return preerr + 'The polar chart requires data to be submitted as [x1] [x1] [x3] etc.  Please see <em>help polar</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div.
        chart = createPolarChart(chartDiv, dataSeries);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      // Draws a stem chart using bar and points.
      // Does not accept time information.  All samples start at n = 0.
      // See samplen() for sample plot that takes time information.
      sample: function sample() {
        var dataSeries = [],
            chart = terminal.getChart(),
            argsLen = args.length;

        if (argsLen === 0) {
          return preerr + 'The sample chart needs to know what data to plot.  Please see <em>help sample</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for plotting.
          try {
            // Check if argument is a terminal variable by trying to retrieve the value.
            for (var i = 0; i < argsLen; i++) {
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The sample chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help sample</em> for more information.');
            }
            // Check for presence of any complex numbers.
            if (args.some(elem => math.typeof(elem[0]) === "Complex")) {
              throw new Error('If working with complex values, make sure to select either the real or imaginary component of your data using re() or im() prior to plotting.  Please see <em>help conv</em> for an example.');
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
            return preerr + 'The sample chart requires data to be submitted as [x1] [x2] [x3] etc.  Please see <em>help sample</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div.
        chart = createSampleChart(chartDiv, dataSeries);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      // Like sample plot, but accepts timing information.
      samplen: function samplen() {
        var dataSeries = [],
            chart = terminal.getChart(),
            argsLen = args.length;

        if (argsLen === 0) {
          return preerr + 'The samplen chart needs to know what data to plot.  Please see <em>help samplen</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for plotting.
          try {
            // Check if argument is a terminal variable by trying to retrieve the value.
            for (var i = 0; i < argsLen; i++) {
              try {
                args[i] = parser.eval(args[i]);
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
              if (math.typeof(args[i]) === 'Matrix') {
                try {
                  args[i] = JSON.parse(args[i]);
                } catch (error) {
                  // Need to decide if error should be thrown.
                }
              }
            }
            // Check if all the arguments are arrays.  If not throw an error.
            if (!args.every(elem => Array.isArray(elem))) {
              throw new Error('The samplen chart only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help samplen</em> for more information.');
            }
            // Check for presence of any complex numbers.
            if (args.some(elem => math.typeof(elem[0]) === "Complex")) {
              throw new Error('If working with complex values, make sure to select either the real or imaginary component of your data using re() or im() prior to plotting.  Please see <em>help conv</em> for an example.');
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
            return preerr + 'The samplen chart requires data to be submitted as [x1] [y1] [x2] [y2] etc.  Please see <em>help samplen</em> for more information. ' + error + sufans; 
          }
        }

        // Recommended by Highcharts for memory management.
        if (chart) chart.destroy();

        // Chart the data in the correct div.
        chart = createSampleChart(chartDiv, dataSeries);

        // If all went well, just return an empty string to the terminal.
        terminal.setChart(chart);
        return '';
      },

      // Adds an x axis label
      xaxis: function xaxis() {
        if (args.length === 0) {
          return preerr + 'The xaxis command adds a label to the x axis of a chart.  Please see <em>help xaxis</em> for more information.' + sufans;
        } else {
          var chart = terminal.getChart(),
              tempArg;
          if (chart) {
            try {
              tempArg = parser.eval(args[0]);
              if (typeof tempArg === 'string') {
                args[0] = tempArg;
              }
            } catch (error) {
              // Not a variable in the console.
              // No need to catch this, just proceed.
            }
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
          var chart = terminal.getChart(),
              tempArg;
          if (chart) {
            try {
              tempArg = parser.eval(args[0]);
              if (typeof tempArg === 'string') {
                args[0] = tempArg;
              }
            } catch (error) {
              // Not a variable in the console.
              // No need to catch this, just proceed.
            }
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
          var chart = terminal.getChart(),
              tempArg;
          if (chart) {
            for (var i = 0; i < args.length; i++) {
              try {
                tempArg = parser.eval(args[i]);
                if (typeof tempArg === 'string') {
                  args[i] = tempArg;
                }
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
            }
            try {
              chart.setTitle({
                text: args[0]
              });
              if (args[1] !== null && isValidColor(args[1])) {
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
          var chart = terminal.getChart(),
              tempArg;
          if (chart) {
            for (var i = 0; i < args.length; i++) {
              try {
                tempArg = parser.eval(args[i]);
                if (typeof tempArg === 'string') {
                  args[i] = tempArg;
                }
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, just proceed.
              }
            }
            try {
              chart.setTitle(null, {
                text: args[0]
              });
              if (args[1] !== null && isValidColor(args[1])) {
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
      },

      // Changes the names of each series.
      series: function series() {
        if (args.length === 0) {
          return preerr + 'The series command adds a custom name to each series of a chart if one exists.  Please see <em>help series</em> for more information.' + sufans;
        } else {
          var chart = terminal.getChart(),
              tempArg;
          if (chart) {
            for (var k = 0; k < args.length; k++) {
              try {
                tempArg = parser.eval(args[k]);
                if (typeof tempArg === 'string') {
                  args[k] = tempArg;
                }
              } catch (error) {
                // Not a variable in the console.
                // No need to catch this, leave args[k] as is.
              }
            }
            try {
              // Check if this is a sample plot which uses both column and scatter to make the stem.
              if (chart.series.length > 1 && chart.series[1].options.linkedTo === ':previous') {
                for (var i = 0; i < chart.series.length; i += 2) {
                  chart.series[i].update({
                    name: args[~~(i / 2)]
                  }, false);
                }
              } else {
                for (var j = 0; j < chart.series.length; j++) {
                  chart.series[j].update({
                    name: args[j]
                  }, false);
                }
              }
              chart.redraw();
            } catch(error) {
              return preerr + 'The text labels for the series command seems to be improperly formatted.  Please see <em>help series</em> for more information.' + sufans;
            }
          }
          return '';
        }
      },

      // List the workstation variables if there are any.
      vars: function vars() {
        if (!Object.keys(parser.scope).length) {
          return preans + 'There are currently no variables defined.' + sufans;
        }
        var _buffer = ['<table class="ink-table">'];
        _buffer.push('<tr><td>Variable</td><td>Size</td><td>Type</td></tr>');
        for(var key in parser.scope) {
          if (parser.scope.hasOwnProperty(key)) {
            _buffer.push('<tr><td class="answer">' + key + '</td><td class="answer">' + math.size(parser.eval(key)) + '</td><td class="answer">' + math.typeof(parser.eval(key)) + '</td></tr>');
          }
        }
        _buffer.push('</table>');
        return _buffer.join('');
      },

      // Load terminal variables from localStorage.
      loadvars: function loadvars() {
        var loadedvars = JSON.parse(localStorage.getItem(termName));
        if (loadedvars === null) {
          return preans + 'There are no stored variables in this terminal.' + sufans;
        }
        for(var key in loadedvars) {
          if (loadedvars.hasOwnProperty(key)) {
            parser.set(key, loadedvars[key]);
          }
        }
        return preans + 'Terminal variables have been loaded.' + sufans;
      },

      // Store terminal variables in storage using localForage.
      savevars: function savevars() {
        if (!Object.keys(parser.scope).length) {
          return preans + 'There are currently no variables defined in this terminal.' + sufans;
        }
        localStorage.setItem(termName, JSON.stringify(parser.scope));
        return preans + 'Terminal variables have been saved.' + sufans;
      },

      // Export data to a local file in csv format.
      // Args[0] should be the csv header and each args
      // after that should be the rows of data.
      exportfile: function exportfile() {
        var dataArray = [],
            argVal,
            argsLen = args.length;

        if (argsLen === 0) {
          return preerr + 'The exportfile command needs to know what data to export.  Please see <em>help exportfile</em> for more information.' + sufans;
        } else {
          // Try to parse the data and format it for exporting.
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
              throw new Error('The exportfile command only accepts arrays (ie, [1,2,3,4]) as arguments. Please see <em>help exportfile</em> for more information.');
            }
            // Create the fields for Papa.unparse.
            for (var j = 1; j < argsLen; j++) {
              dataArray.push(args[j]);
            }
            // Catch any errors.
          } catch(error) {
            // Type error.
            if (error.name.toString() == "TypeError") {
              return preerr + error.name + ': There seems to be something wrong with the data.  Please see <em>help exportfile</em> for more information.' + sufans;
            }
            // Some other kind of error has occurred.
            return preerr + 'There seems to be something wrong with the data.  Please see <em>help exportfile</em> for more information. ' + error + sufans; 
          }
        }

        var csv = Papa.unparse({
          fields: args[0],
          data: dataArray
        });

        // This is opening a save as dialog box.  Is that necessary? Desired?
        var blob = new Blob([csv], {type: "text/csv; charset=utf-8"});
        saveAs(blob, "convolv_export.csv");

        return '';
      },

      // Import a local file and load variables into the scope.
      // File is assumed to be CSV formatted.  Also generates an import log.
      importfile: function loadfile() {
        var fileElem = document.getElementById("fileElem");

        if (fileElem) {
          fileElem.click();
        }

        fileElem.addEventListener('change', function(evt) {
          var file = evt.target.files[0];
          var logInfo = {
            "File name": file.name,
            "File size": file.size + ' bytes',
            "File type": file.type,
            "Last saved": moment(file.lastModifiedDate).format('MMM Do YYYY, h:mm:ss a'),
            "Parse Began": moment().format('MMM Do YYYY, h:mm:ss a')
          };
          terminal.setImportLog(logInfo);
          var start = Date.now(), 
              end;

          Papa.parse(file, {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
            complete: function complete(results) {
              var output = {},
                  removeSpaces = /[\s-.]/g,
                  keys = [],
                  vars = [],
                  varName,
                  categories = "im_" + file.name.slice(0, 5).replace(removeSpaces, "") + '_header';

              logInfo["Parse complete"] = moment().format('MMM Do YYYY, h:mm:ss a');
              logInfo["Rows of data"] = results.data.length;
              logInfo["Delimiter detected"] = results.meta.delimiter;
              if (results.errors.length) {
                for (var i = 0; i < results.errors.length; i++) {
                  logInfo["Error code " + Number(i + 1)] = results.errors[i].code;
                  logInfo["Error message " + Number(i + 1)] = results.errors[i].message;
                }
              } else {
                logInfo["Error message"] = "File parsed with no errors.";
                for (var key in results.data[0]) {
                  if (results.data[0].hasOwnProperty(key) && key.length !== 0) {
                    keys.push(key);
                    varName = "im_" + key.replace(removeSpaces, "_");
                    vars.push(varName);
                    output[key] = results.data[0][key] === "" ? [null] : [results.data[0][key]];
                    for (var j = 1; j < results.data.length; j++) {
                      if (results.data[j][key] === "") {
                        output[key].push(null);
                      } else {
                        output[key].push(results.data[j][key]);
                      }
                    }
                  }
                  parser.set(varName, output[key]);
                }
                parser.set(categories, keys);
                logInfo["Generated vars"] = categories + ", " + vars.join(", ");
              }

              end = Date.now();
              logInfo["Elapsed time"] = (end - start) + " ms";
              terminal.setImportLog(logInfo);
            },
            error: function error(err, file) {
              logInfo["Error message "] = err.message;
              logInfo["Generated vars"] = "There were errors reading the file.  No variables were imported.";
              logInfo["Elapsed time"] = (end - start) + " ms";
              terminal.setImportLog(logInfo);
            }
          });
        }, false);

        return '';
      },

      // Import a file from a URL.  Supports passing a token to the URL
      // through the header.
      // Imported data is assumed to be JSON.
      importurl: function importurl() {
        var tokenObj = {},
            keys = [],
            keyNumber = [],
            output = {},
            removeSpaces = /[\s-.]/g,
            vars = [],
            varName,
            errorOnParse = false,
            categories,
            prefix,
            csv,
            results,
            parseConfig = {
              dynamicTyping: true,
              header: true,
              skipEmptyLines: true
            };

        for (var k = 0; k < args.length; k++) {
          try {
            args[k] = parser.eval(args[k]);
          } catch (error) {
            // Not a variable in the console.
            // No need to catch this, leave args[k] as is.
          }
        }

        // If user provided a token, define it in the token object.
        if (typeof args[1] !== "undefined") {
          tokenObj.token = args[1];
        }

        // Create a prefix for the variable names based on the file name portion of the path.
        prefix = "i" + args[0].match(/([\w\d_-]*)\.?[^\\\/]*$/i)[1] + "_";
        // Create the categories variable name from the file name portion of the path.
        categories = prefix + 'header';

        // Start the log file.
        var logInfo = {
          "File path": args[0],
          "Parse Began": moment().format('MMM Do YYYY, h:mm:ss a')
        };
        terminal.setImportLog(logInfo);
        var start = Date.now(), 
            end;

        fetch(args[0], { headers: tokenObj })
          .then(function(response) {
          return response.json();
        }).then(function(json) {
          if (json !== null && Array.isArray(json)) {
            csv = Papa.unparse(json);
            results = Papa.parse(csv, parseConfig);
          } else if (json !== null && typeof json === 'object') {
            for(var _key in json) {
              if (json.hasOwnProperty(_key) && Array.isArray(json[_key])) {
                keyNumber.push(_key);
              }
            }
            if (keyNumber.length === 1) {
              // If there is only one value that is an array, 
              // assume this is the data.
              csv = Papa.unparse(json[keyNumber[0]]);
              results = Papa.parse(csv, parseConfig);
            } else if (keyNumber.length === 2) {
              // Assume we have explicit fields and data arrays.
              // Papa unparse can handle this directly.
              csv = Papa.unparse(json);
              results = Papa.parse(csv, parseConfig);
            } else {
              // Log an error with the data.  Not sure what to do with it.
              errorOnParse = true;
            }
          }

          if (!errorOnParse) {
            logInfo["Parse complete"] = moment().format('MMM Do YYYY, h:mm:ss a');
            logInfo["Rows of data"] = results.data.length;
            logInfo["Delimiter detected"] = results.meta.delimiter;
            if (results.errors.length) {
              for (var i = 0; i < results.errors.length; i++) {
                logInfo["Error code " + Number(i + 1)] = results.errors[i].code;
                logInfo["Error message " + Number(i + 1)] = results.errors[i].message;
              }
            } else {
              logInfo["Error message"] = "File parsed with no errors.";
              for (var key in results.data[0]) {
                if (results.data[0].hasOwnProperty(key) && key.length !== 0) {
                  keys.push(key);
                  varName = prefix + key.replace(removeSpaces, "_");
                  vars.push(varName);
                  output[key] = results.data[0][key] === "" ? [null] : [results.data[0][key]];
                  for (var j = 1; j < results.data.length; j++) {
                    if (results.data[j][key] === "") {
                      output[key].push(null);
                    } else {
                      output[key].push(results.data[j][key]);
                    }
                  }
                }
                parser.set(varName, output[key]);
              }
              parser.set(categories, keys);
              logInfo["Generated vars"] = categories + ", " + vars.join(", ");
            }
            // Permanently put the json in local storage.  Need prefix key to retrieve.
            localStorage.setItem(prefix + termName, JSON.stringify(results.data));
            // Store the key of the most recent import to be used by datatable 
            // if no key is provided as an argument to that function.
            localStorage.setItem(termName + "_table", prefix + termName);
            logInfo["Raw Data Storage Key"] = prefix + termName;
            end = Date.now();
            logInfo["Elapsed time"] = (end - start) + " ms";
            terminal.setImportLog(logInfo);
          } else {
            logInfo["Error message"] = "Parsing was not successful.  Parser could not read file format.";
            end = Date.now();
            logInfo["Elapsed time"] = (end - start) + " ms";
            terminal.setImportLog(logInfo);
          }
        }, function(error) {
          logInfo["Parse terminated"] = moment().format('MMM Do YYYY, h:mm:ss a');
          logInfo["Error message"] = "Parsing was not successful.  Could not read file. " + error;
          end = Date.now();
          logInfo["Elapsed time"] = (end - start) + " ms";
          terminal.setImportLog(logInfo);

        }).catch(function(ex) {
          logInfo["Parse terminated"] = moment().format('MMM Do YYYY, h:mm:ss a');
          logInfo["Error message"] = "Parsing was not successful.  Could not read file. " + ex;
          end = Date.now();
          logInfo["Elapsed time"] = (end - start) + " ms";
          terminal.setImportLog(logInfo);
        });

        return '';
      },

      // Returns the import log in table form to the console.
      importlog: function importlog() {
        return terminal.getImportLog();
      },

      // Opens a new tab or window with the most recent imported data from a url.
      // Also accepts one optional argument of a data storage key if a previously
      // imported data is desired.
      datatable: function datatable() {
        var dataWindow,
            tableUrl = "pages/datatable/index.html";
        if (args.length === 0) {
          dataWindow = window.open(tableUrl);
          dataWindow.dataKey = localStorage.getItem(termName + "_table");
          return '';
        } else {
          if (localStorage.getItem(args[0]) !== null) {
            dataWindow = window.open(tableUrl);
            dataWindow.dataKey = args[0];
            return '';
          } else {
            return 'There is nothing stored locally using key ' + args[0] + '.';
          }
        }

      },

      // Opens a new tab or window with a full set of documentation.
      docs: function docs() {
        var docsWindow,
            docsUrl = "pages/documentation/index.html";
        docsWindow = window.open(docsUrl);
        return '';
      },

      // Opens a new tab or window with a list of credits.
      credits: function credits() {
        var creditsWindow,
            creditsUrl = "pages/credits/index.html";
        creditsWindow = window.open(creditsUrl);
        return '';
      }
    };
  };
}());