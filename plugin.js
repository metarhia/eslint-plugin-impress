'use strict';

const plugin = {};
module.exports = plugin;

const processor = {};
plugin.processors = {
  '.js': processor,
};

const UNIX_NEWLINE = '\n';
const UNIX_NEWLINE_LENGTH = 1;
const WINDOWS_NEWLINE = '\r\n';
const WINDOWS_NEWLINE_LENGTH = 2;

const CONFIG_REGEX = /\/(config|schemas)\//;
const APP_SCRIPT_REGEX =
  /\/applications\/\w+\/(api|www|tasks|init|setup|model|lib)\//;

const MODULE_EXPORTS = 'module.exports = ';
const USE_STRICT = '\'use strict\'; ';

const modifiedFiles = new Map();

processor.preprocess = (text, filename) => {
  const knownPath = CONFIG_REGEX.test(filename) ||
                    APP_SCRIPT_REGEX.test(filename);
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

  const isConfig  = text.startsWith('{') || text.startsWith('[');
  const isHandler = text.startsWith('(') || text.startsWith('function');

  const changes = {
    prefix: '',
    suffix: '',
  };

  if (isConfig || isHandler) {
    changes.prefix += MODULE_EXPORTS;
    changes.suffix += ';';
  }

  const inducedOverflow = text.split('\n')[0].length <= 80;
  modifiedFiles.set(filename, inducedOverflow);

  changes.prefix = USE_STRICT + changes.prefix;
  text = changes.prefix + text + changes.suffix + trail;
  return [text];
};

processor.postprocess = (messages, filename) => {
  // `preprocess` returns only one element in the array, so there's only one in
  // `postprocess` too.
  messages = messages[0];

  if (messages.length === 0) {
    return messages;
  }

  const firstMsg = messages[0];
  const isFirstLineOverflown = firstMsg.ruleId === 'max-len' &&
                               firstMsg.line === 1;
  const inducedOverflow = modifiedFiles.get(filename);
  if (isFirstLineOverflown && inducedOverflow) {
    messages.shift();
  }

  return messages;
};
