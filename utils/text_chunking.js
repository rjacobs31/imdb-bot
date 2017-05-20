const _ = require('lodash');

function chunkString(str, chunkSize) {
  if (typeof str !== 'string') {
    throw new TypeError('Non-string param passed for chunking.');
  }    

  let sentences = [];
  let i = 0;

  while (i < str.length) {
    if (str.length - i <= chunkSize) {
      if (str.length - i > 0) {
        sentences.push(str.slice(i));
      }
      break;
    } else {
      let idx = str.indexOf('.', i);
      if (idx < 0 || (idx - i > chunkSize)) {
        let lastIdx = str.lastIndexOf(' ', i + chunkSize);
        if (lastIdx < 0 || lastIdx < i) {
          sentences.push(_.trim(str.slice(i, i + chunkSize)));
          i += chunkSize;
        } else {
          sentences.push(_.trim(str.slice(i, lastIdx + 1)));
          i = lastIdx + 1;
        }
      } else {
        sentences.push(_.trim(str.slice(i, idx + 1)));
        i = idx + 1;
      }
    }
  }
  return sentences;
}

module.exports = {
  chunkString: chunkString
};
