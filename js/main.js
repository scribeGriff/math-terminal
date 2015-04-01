/* global math: false, katex: false, Terminal: false, document: false, vis: false, c3: false */
/* jshint node: true, browser: true */
(function () {
  "use: strict";

  // Configures Math.js to use big numbers as the default number.
  math.config({
    number: 'bignumber'  // Default type of number: 'number' (default) or 'bignumber'
  });

  /* Taking c3 for a spin with a plot command */
  math.import({
    plot: function (data) {
      var chart2 = c3.generate({
        bindto: '#datagraph',
        data: {
          x: 'x',
          columns: [
            ['x', 30, 50, 100, 230, 300, 310],
            ['data1', 30, 200, 100, 400, 150, 250],
            ['data2', 130, 300, 200, 300, 250, 450]
          ]
        },
        zoom: {
          enabled: true
        },
        padding: {
          right: 20
        }
      });
      setTimeout(function () {
        chart2.load({
          columns: [
            ['data1', 100, 250, 150, 200, 100, 350]
          ]
        });
      }, 1000);
      setTimeout(function () {
        chart2.load({
          columns: [
            ['data3', 80, 150, 100, 180, 80, 150]
          ]
        });
      }, 1500);
      setTimeout(function () {
        chart2.unload({
          ids: 'data2'
        });
      }, 2000);
    }
  });

  var parser = new math.parser();
  var preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">';
  var sufans = '</span>';
  var precision = 8;  // default value.

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
            line = '';
            if (args) {
              line = args.join(" ");
            }
            command = cmd + line;
            result = parser.eval(command);
          } catch(error) {
            // Unknown command.
            return false;
          }
          if (command.match(/^plot.*$/)) {
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