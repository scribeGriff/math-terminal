/* global math: false, katex: false, Terminal: false */
(function () {
  "use: strict";
  
  // Configures Math.js to use big numbers as the default number.
  math.config({
    number: 'bignumber'  // Default type of number: 'number' (default) or 'bignumber'
  });

  // Convert the 'terminal' DOM element into a live terminal.
  // This example defines several custom commands for the terminal.
  var terminal = new Terminal('terminal', {}, {
    execute: function(cmd, args) {
      switch (cmd) {
        case 'clear':
          terminal.clear();
          return '';

        case 'help':
          return 'Commands: clear, help, theme, ver or version<br>More help available <a class="external" href="http://github.com/SDA/terminal" target="_blank">here</a>';

        case 'theme':
          if (args && args[0]) {
            if (args.length > 1) return 'Too many arguments';
            else if (args[0].match(/^interlaced|modern|white$/)) { terminal.setTheme(args[0]); return ''; }
            else return 'Invalid theme';
          }
          return terminal.getTheme();

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
            result = math.eval(command);
          } catch(error) {
            // Unknown command.
            return false;
          }
          // Check for Katex format of solution.
          try {
            // TODO: Need some logic for formatting.
            formres = math.format(result, 8);
            katstr = katex.renderToString(formres);
            return '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">' + katstr + '</span>';
          } catch(error) {
            return '<i class="prefix fa fa-angle-double-right"></i> <span class="answer">' + formres + '</span>';
          }
      }
    }
  });
}());