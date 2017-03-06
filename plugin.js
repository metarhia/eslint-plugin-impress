'use strict';

const plugin = {};
module.exports = plugin;

const processor = {};
plugin.processors = {
  '.js': processor
};

const UNIX_NEWLINE = '\n';
const UNIX_NEWLINE_LENGTH = 1;
const WINDOWS_NEWLINE = '\r\n';
const WINDOWS_NEWLINE_LENGTH = 2;

const CONFIG_REGEX = /\/(config|schemas)\//;
const APP_SCRIPT_REGEX =
  /\/applications\/\w+\/(api|www|tasks|init|setup|model|lib)\//;

processor.preprocess = (text, filename) => {
  const knownPath = (
    CONFIG_REGEX.test(filename) || APP_SCRIPT_REGEX.test(filename)
  );
  if (!knownPath) {
    return [text];
  }

  let trail = '';
  if (text.endsWith(WINDOWS_NEWLINE)) {
    trail = WINDOWS_NEWLINE;
    text = text.slice(0, -WINDOWS_NEWLINE_LENGTH);
  } else if (text.endsWith(UNIX_NEWLINE)) {
    trail = UNIX_NEWLINE;
    text = text.slice(0, -UNIX_NEWLINE_LENGTH);
  }

  const isConfig = text.startsWith('{') || text.startsWith('[');
  const isHandler = text.startsWith('(') || text.startsWith('function');

  if (isConfig || isHandler) {
    text = 'module.exports = ' + text + ';';
  }

  text = '\'use strict\'; ' + text + trail;
  return [text];
};

processor.postprocess = (messages/*, filename*/) => messages[0];
