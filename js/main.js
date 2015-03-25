/* global math: false, katex: false, Terminal: false */
(function () {
  "use: strict";

  // Configures Math.js to use big numbers as the default number.
  math.config({
    number: 'bignumber'  // Default type of number: 'number' (default) or 'bignumber'
  });

  var parser = new math.parser();
  var preans = '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">';
  var sufans = '</span>';

  var helpinfo = [
    '<table class="ink-table">',
    '<tr><td>clear</td><td class="answer">clears command window</td></tr>',
    '<tr><td>clear vars</td><td class="answer">clears workspace variables</td></tr>',
    '<tr><td>clear all</td><td class="answer">clears window and variables</td></tr>',
    '<tr><td>help</td><td class="answer">displays this help screen</td></tr>',
    '<tr><td>help <em>command</em></td><td class="answer">displays a link to Math.js <em>command</em> documentation</td></tr>',
    '<tr><td>theme</td><td class="answer">displays current theme</td></tr>',
    '<tr><td>theme <em>name</em></td><td class="answer">change to theme <em>name</em></td></tr>',
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

        case 'ver':
        case 'version':
          return '1.0.0';

        default:
          var line, command, result, katstr, formres;
          // Check for valid Math.js command.
          try {
            line = '';
            if (args) line = args.join(" ");
            command = cmd + line;
            result = parser.eval(command);
          } catch(error) {
            // Unknown command.
            return false;
          }
          // Check for Katex format of solution.
          try {
            // TODO: Need some logic for formatting.
            formres = math.format(result, 8);
            katstr = katex.renderToString(formres);
            return preans + katstr + sufans;
          } catch(error) {
            return preans + formres + sufans;
          }
      }
    }
  });
}());