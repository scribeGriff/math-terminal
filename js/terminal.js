/* The following code is based on Terminal by Sasa Djolic.
   Original Copyright (c) 2012 Sasa Djolic, SDA Software Associates Inc.
   The original license can be found here: https://github.com/SDA/terminal/blob/master/LICENSE
*/

/* global math:false, katex: false, awesomplete: false, acIsOpen: false, awesompleteDivUl: false */
/* jshint node: true, browser: true */

(function (global, undefined) {
  "use: strict";

  var Terminal = Terminal || function(containerID, uoptions) {
    if (!containerID) return;

    var defaults = {
      welcome: 'Welcome to The Math Console.<br>To get started, type help at the prompt.',
      prompt: '',
      separator: '<i class="fa fa-angle-right"></i>',
      theme: 'monokai'
    };

    var options = uoptions || defaults;
    options.welcome = options.welcome || defaults.welcome;
    options.prompt = options.prompt || defaults.prompt;
    options.separator = options.separator || defaults.separator;
    options.theme = options.theme || defaults.theme;

    var matchAllBuiltIns = /^help.*|clear.*|theme.*|precision.*|line.*|linepts.*|curve.*|curvepts.*|samples.*|xaxis.*|yaxis.*|info.*|getData.*$/i;
    var matchConsoleCmds = /^help.*|clear.*|theme.*|precision.*$/i;

    var extensions = Array.prototype.slice.call(arguments, 2);

    var _history = localStorage.history ? JSON.parse(localStorage.history) : [];
    var _histpos = _history.length;
    var _histtemp = '';

    var ffOptions = false, sUsrAg = navigator.userAgent;

    if (sUsrAg.indexOf("Firefox") > -1) {
      ffOptions = true;
    }

    // Create terminal and cache DOM nodes;
    var _terminal = document.getElementById(containerID);
    _terminal.classList.add('terminal');
    _terminal.classList.add('terminal-' + options.theme);
    _terminal.insertAdjacentHTML('beforeEnd', [
      '<div class="container">',
      '<output></output>',
      '<table class="input-line">',
      '<tr><td nowrap><div class="prompt">' + options.prompt + options.separator + '</div></td><td width="100%"><input class="cmdline" id="autocomp" autofocus /></td></tr>',
      '</table>',
      '</div>'].join(''));
    var _mathterm = document.querySelector('.terminal-background');
    _mathterm.classList.add('terminal-' + options.theme + '-background');
    var _chartcont = document.querySelector('.chart-container');
    _chartcont.classList.add('chart-' + options.theme);
    var _container = _terminal.querySelector('.container');
    var _inputLine = _container.querySelector('.input-line');
    var _cmdLine = _container.querySelector('.input-line .cmdline');
    var _output = _container.querySelector('output');
    var _prompt = _container.querySelector('.prompt');

    if (options.welcome) {
      output(options.welcome);
    }

    window.addEventListener('click', function(e) {
      _cmdLine.focus();
    }, false);

    _output.addEventListener('click', function(e) {
      e.stopPropagation();
    }, false);

    // Always force text cursor to end of input line.
    _cmdLine.addEventListener('click', inputTextClick, false);
    _inputLine.addEventListener('click', function(e) {
      _cmdLine.focus();
    }, false);

    // Handle up/down key presses for shell history and enter for new command.
    _cmdLine.addEventListener('keyup', historyHandler, false);
    _cmdLine.addEventListener('keydown', processNewCommand, false);

    window.addEventListener('keyup', function(e) {
      _cmdLine.focus();
      e.stopPropagation();
      e.preventDefault();
    }, false);

    function inputTextClick(e) {
      this.value = this.value;
    }

    function historyHandler(e) {
      // Clear command-line on Escape key.
      if (e.keyCode == 27) {
        this.value = '';
        e.stopPropagation();
        e.preventDefault();
      }

      if (_history.length && (e.keyCode == 38 || e.keyCode == 40)) {
        if (_history[_histpos]) {
          _history[_histpos] = this.value;
        }
        else {
          _histtemp = this.value;
        }

        if (e.keyCode == 38 && !acIsOpen) {
          // Up arrow key.
          _histpos--;
          if (_histpos < 0) {
            _histpos = 0;
          }
        }
        else if (e.keyCode == 40 && !acIsOpen) {
          // Down arrow key.
          _histpos++;
          if (_histpos > _history.length) {
            _histpos = _history.length;
          }
        }

        this.value = _history[_histpos] ? _history[_histpos] : _histtemp;

        // Move cursor to end of input.
        this.value = this.value;
      }
    }

    function processNewCommand(e) {
      // Only handle the Enter key.
      if (e.keyCode != 13) return;

      // If autocomplete list is open, let awesomplete
      // handle Enter key.
      if (awesomplete && acIsOpen) return;

      var cmd, args, line, input, acdiv;
      var cmdline = this.value;

      // Save shell history.
      if (cmdline) {
        _history[_history.length] = cmdline;
        localStorage.history = JSON.stringify(_history);
        _histpos = _history.length;
      }

      // Duplicate current input and append to output section.
      if(awesomplete) {
        line = this.parentNode.parentNode.parentNode.parentNode.parentNode.cloneNode(true);
      } else {
        line = this.parentNode.parentNode.parentNode.parentNode.cloneNode(true);
      }

      line.removeAttribute('id');
      line.classList.add('line');

      input = line.querySelector('input.cmdline');
      if (input.value === '') return;
      input.autofocus = false;
      input.readOnly = true;

      // Check if a valid built-in command name.  If not, try to format as tex
      // and render with KaTeX.
      // With awesomplete, we now have an extra layer of heirarchy with the added div.
      if (input.value.match(matchAllBuiltIns)) {
        if (awesomplete) {
          input.parentNode.insertAdjacentHTML('beforebegin', input.value);
        } else {
          input.insertAdjacentHTML('beforebegin', input.value);
        }
      } else {
        try {
          var rendstr = katex.renderToString(math.parse(input.value).toTex());
          if (awesomplete) {
            input.parentNode.insertAdjacentHTML('beforebegin', rendstr);
          } else {
            input.insertAdjacentHTML('beforebegin', rendstr);
          }
          // This part is a kluge since KaTex doesn't have full support of TeX yet.
        } catch(error) {
          try {
            if (awesomplete) {
              input.parentNode.insertAdjacentHTML('beforebegin', katex.renderToString(input.value));
            } else {
              input.insertAdjacentHTML('beforebegin', katex.renderToString(input.value));
            }
          } catch(error2) {
            if (awesomplete) {
              input.parentNode.insertAdjacentHTML('beforebegin', input.value);
            } else {
              input.insertAdjacentHTML('beforebegin', input.value);
            }
          }
        }
      }
      // With awesomplete, need to get rid of the added div that wraps the input tag.
      if (awesomplete) {
        acdiv = line.querySelector('.awesomplete');
        acdiv.parentNode.removeChild(acdiv);
      } else {
        input.parentNode.removeChild(input);
      }
      _output.appendChild(line);

      // Hide command line until we're done processing input.
      _inputLine.classList.add('hidden');

      // Clear/setup line for next input.
      this.value = '';

      // Parse out command, args, and trim off whitespace.
      if (cmdline && cmdline.trim()) {
        // If command line starts with a predefined console function, parse arguments, if any.
        if (cmdline.match(matchConsoleCmds)) {
          args = cmdline.split(' ').filter(function(val, i) {
            return val;
          });
          cmd = args[0];
          // Remove cmd from arg list.
          args = args.splice(1);
          // Otherwise, just pass the entire command line as the command.
        } else {
          cmd = cmdline;
        }
      }

      if (cmd) {
        var response = false;
        for (var index in extensions) {
          var ext = extensions[index];
          if (ext.execute) response = ext.execute(cmd, args);
          if (response !== false) break;
        }
        if (response === false) {
          response = '<i class="prefix fa fa-angle-double-right"></i> </span><span class="cmderror">' + cmd + ': No such variable or command</span>';
        }
        output(response);
      }

      // Show the command line.
      _inputLine.classList.remove('hidden');
      if (ffOptions) {
        _inputLine.scrollIntoView({ block: "end", behavior: "smooth" });
      } else {
        _inputLine.scrollIntoView();
      }
    }

    function clear() {
      _output.innerHTML = '';
      _cmdLine.value = '';
    }

    function output(html) {
      _output.insertAdjacentHTML('beforeEnd', html);
      if (ffOptions) {
        _inputLine.scrollIntoView({ block: "end", behavior: "smooth" });
      } else {
        _inputLine.scrollIntoView();
      }
      
      if (awesompleteDivUl !== null) {
        if (_terminal.scrollHeight - _terminal.scrollTop === _terminal.clientHeight) {
          awesompleteDivUl.classList.remove('bottom50');
        } else {
          awesompleteDivUl.classList.add('bottom50');
        }
      }
    }

    return {
      clear: clear,
      setPrompt: function(prompt) { 
        _prompt.innerHTML = prompt + options.separator; 
      },
      getPrompt: function() { 
        return _prompt.innerHTML.replace(new RegExp(options.separator + '$'), ''); 
      },
      setTheme: function(theme) {
        _terminal.classList.remove('terminal-' + options.theme);
        _mathterm.classList.remove('terminal-' + options.theme + '-background');
        _chartcont.classList.remove('chart-' + options.theme);
        options.theme = theme; 
        _terminal.classList.add('terminal-' + options.theme);
        _mathterm.classList.add('terminal-' + options.theme + '-background');
        _chartcont.classList.add('chart-' + options.theme);
      },
      getTheme: function() {
        return options.theme; 
      },
      clearWelcome: function() {
        options.welcome = '';
      }
    };
  };

  // node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Terminal;

    // web browsers
  } else {
    var oldTerminal = global.Terminal;
    Terminal.noConflict = function () {
      global.Terminal = oldTerminal;
      return Terminal;
    };
    global.Terminal = Terminal;
  }

})(this);
