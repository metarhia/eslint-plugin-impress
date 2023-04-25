'use strict';

const plugin = {};
module.exports = plugin;

const processor = {
  supportsAutofix: true,
};
plugin.processors = {
  '.js': processor,
};

const UNIX_NEWLINE = '\n';
const UNIX_NEWLINE_LENGTH = 1;
const WINDOWS_NEWLINE = '\r\n';
const WINDOWS_NEWLINE_LENGTH = 2;

const CONFIG_REGEX = /\/(config|schemas)\//;
const APP_SCRIPT_REGEX =
  /\/applications\/\w+\/(api|www|tasks|init|setup|model|resources|lib)\//;

const USE_STRICT = "'use strict';\n";

const modifiedFiles = new Map();

processor.preprocess = (text, filename) => {
  const extractedPath =
    CONFIG_REGEX.exec(filename) || APP_SCRIPT_REGEX.exec(filename);
  if (!extractedPath) {
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

  const trimmedText = text.trim();

  const isObj = trimmedText.startsWith('{');
  const isArr = trimmedText.startsWith('[') && trimmedText.endsWith(']');
  const isApi = extractedPath[1] === 'api';
  const isFunction = trimmedText.startsWith('function');
  let prefixLen = USE_STRICT.length;

  if (isObj) {
    text = `(${text});`;
    prefixLen++;
  } else if (!trimmedText.endsWith(';') && (isArr || (isApi && !isFunction))) {
    text += ';';
  }

  text = USE_STRICT + text + trail;
  modifiedFiles.set(filename, { isObj, prefixLen });
  return [text];
};

processor.postprocess = (messages, filename) => {
  // `preprocess` returns only one element in the array, so there's only one in
  // `postprocess` too.
  messages = messages[0];

  if (messages.length === 0) {
    return messages;
  }

  const modifications = modifiedFiles.get(filename);

  if (modifications) {
    const { isObj, prefixLen } = modifications;
    messages.forEach((message) => {
      if (message.line === 1) return;
      message.line--;
      if (isObj && message.line === 1 && message.column !== 1) {
        message.column--;
      }
      if (message.fix && message.fix.range) {
        if (
          message.fix.range[0] > prefixLen &&
          message.fix.range[1] > prefixLen
        ) {
          message.fix.range[0] -= prefixLen;
          message.fix.range[1] -= prefixLen;
        } else {
          delete message.fix;
        }
      }
    });
  }
  return messages;
};
