'use strict';

var plugin = {};
module.exports = plugin;

var processor = {};
plugin.processors = {
  '.js': processor
};

var UNIX_NEWLINE = '\n';
var UNIX_NEWLINE_LENGTH = 1;
var WINDOWS_NEWLINE = '\r\n';
var WINDOWS_NEWLINE_LENGTH = 2;

var CONFIG_REGEX = /\/(config|schemas)\//;
var APP_SCRIPT_REGEX =
  /\/applications\/\w+\/(api|www|tasks|init|setup|model|lib)\//;

processor.preprocess = function(text, filename) {
  var knownPath = (
    CONFIG_REGEX.test(filename) || APP_SCRIPT_REGEX.test(filename)
  );
  if (!knownPath) {
    return [text];
  }

  var trail = '';
  if (text.endsWith(WINDOWS_NEWLINE)) {
    trail = WINDOWS_NEWLINE;
    text = text.slice(0, -WINDOWS_NEWLINE_LENGTH);
  } else if (text.endsWith(UNIX_NEWLINE)) {
    trail = UNIX_NEWLINE;
    text = text.slice(0, -UNIX_NEWLINE_LENGTH);
  }

  var isConfig = text.startsWith('{') || text.startsWith('[');
  var isHandler = text.startsWith('(') || text.startsWith('function');

  if (isConfig || isHandler) {
    text = 'module.exports = ' + text + ';';
  }

  text = '\'use strict\'; ' + text + trail;
  return [text];
};

processor.postprocess = function(messages/*, filename*/) {
  return messages[0];
};
